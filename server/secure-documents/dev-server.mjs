/**
 * SEYVEO Secure Documents — LOCAL development API.
 * Never expose to the internet. No production identity, database, MFA,
 * certified E-signature, backup, concurrent-process support or real delivery.
 * Optional encrypted disk snapshot is enabled ONLY via an explicit path.
 */
import { createServer } from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createEncryptedDevStore } from './dev-store.mjs';
import { openDevTenantStore } from './sqlite-tenant-store.mjs';
import { createTrainingInvitations } from './dev-invitations.mjs';
import { projectDocumentMailbox } from './mailbox-view.mjs';
import { mailboxTag, mailboxUnchanged } from './mailbox-tag.mjs';
import {
  canCreateDocument, canReadDocument, canReadDocumentAudit,
  canTransitionDocument
} from '../document-authorization.mjs';

const MAX_BODY_BYTES = 16 * 1024;
const SESSION_MS = 30 * 60 * 1000;
const MAX_ACTIVE_SESSIONS_PER_USER = 5;
const MAX_DOCS = 100;
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 60 * 1000;

class HttpProblem extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function fail(status, message) { throw new HttpProblem(status, message); }
function isText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 &&
    value.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value);
}
function hashToken(value) {
  return createHash('sha256').update(value).digest('hex');
}
function secureHash(password, salt) {
  return scryptSync(password, salt, 64);
}
function newAccount(userId, role, password) {
  if (!isText(password, 200) || password.length < 12)
    throw new Error('Developer account passwords must be at least 12 characters.');
  const salt = randomBytes(16);
  return Object.freeze({
    userId, role, salt,
    passwordHash: secureHash(password, salt)
  });
}
function checkPassword(account, password) {
  if (typeof password !== 'string' || password.length > 200) return false;
  const candidate = secureHash(password, account.salt);
  return timingSafeEqual(candidate, account.passwordHash);
}
function encryptedContent(text, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), encrypted };
}
function decryptedContent(sealed, key) {
  const decipher = createDecipheriv('aes-256-gcm', key, sealed.iv);
  decipher.setAuthTag(sealed.tag);
  return Buffer.concat([decipher.update(sealed.encrypted), decipher.final()]).toString('utf8');
}
async function readJson(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json'))
    fail(415, 'Нужен Content-Type: application/json.');
  let length = 0, chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) fail(413, 'Слишком большой запрос.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Ожидался JSON-объект.');
    return value;
  } catch (error) {
    if (error instanceof HttpProblem) throw error;
    fail(400, 'Некорректный JSON.');
  }
}
function send(res, status, payload, extraHeaders={}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}
const meta = d => ({
  id:d.id, organizationId:d.organizationId, creatorUserId:d.creatorUserId,
  recipientUserId:d.recipientUserId, type:d.type, title:d.title,
  status:d.status, createdAt:d.createdAt, updatedAt:d.updatedAt
});
const nextState = Object.freeze({
  read:'read', acknowledge:'acknowledged', approve:'approved',
  return:'returned', revoke:'revoked'
});

/**
 * Provides a loopback-only prototype. No actor or role comes from the client.
 * Credentials are from trusted environment bootstrap and hashed in memory.
 * The master key lives only in RAM; optional persistence stores ciphertext.
 */
export function createDevDocumentServer({ ownerPassword, employeePassword, masterKey, organizationId='demo-org', storagePath, sqlitePath } = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Production is intentionally disabled.');
  if (!Buffer.isBuffer(masterKey) || masterKey.length !== 32)
    throw new Error('A random 32-byte development encryption key is required.');
  if (!isText(organizationId, 128)) throw new Error('Invalid organization ID.');
  if (ownerPassword === employeePassword) throw new Error('Developer account passwords must differ.');
  const users = new Map([
    ['owner', newAccount('owner', 'owner', ownerPassword)],
    ['elena', newAccount('elena', 'employee', employeePassword)]
  ]);
  const memberships = new Map(Array.from(users, ([userId, user]) => [userId, {
    userId, organizationId, role: user.role, status:'active'
  }]));
  if(sqlitePath&&storagePath)throw new Error('Select only one development persistence backend.');
  const sqlite=sqlitePath?openDevTenantStore({filePath:sqlitePath,masterKey}):null;
  try{sqlite?.ensureDemoTenant({organizationId,ownerUserId:'owner',employeeUserId:'elena'});}
  catch(error){sqlite?.close();throw error;}
  const sessions = new Map();
  // Synthetic, in-memory onboarding only. Production identity and persisted
  // memberships require a separate trusted service with reviewed migrations.
  const invitations=createTrainingInvitations({
    users,memberships,organizationId,
    makeEmployeeAccount:(userId,password)=>newAccount(userId,'employee',password),
    revokeSessions:userId=>{
      for(const [digest,session] of sessions)
        if(session.userId===userId)sessions.delete(digest);
    }
  });
  const storage=storagePath?createEncryptedDevStore({filePath:storagePath,masterKey}):null;
  // Deliberately fail startup on wrong key, tampered ciphertext, or invalid format.
  const loaded=storage?.load()||{documents:new Map(),audit:new Map()};
  let documents=loaded.documents;
  let audit=loaded.audit;
  const attempts = new Map();

  const securityContext = req => {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !/^Bearer [A-Za-z0-9_-]{40,160}$/.test(header))
      fail(401, 'Требуется действующая сессия.');
    const token = header.slice(7);
    const digest = hashToken(token);
    const session = sessions.get(digest);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(digest);
      fail(401, 'Сессия истекла или недействительна.');
    }
    let membership;
    if(sqlite){
      try{membership=sqlite.getMembership({actor:{userId:session.userId},organizationId});}
      catch{fail(403,'Нет действующего доступа.');}
    }else membership=memberships.get(session.userId);
    if (!membership || membership.status !== 'active') fail(403, 'Нет действующего доступа.');
    return { actor: { userId: session.userId }, membership, session };
  };
  const loadDocument = (id, context) => {
    const doc = documents.get(id);
    if (!doc || !canReadDocument({ ...context, document:doc })) fail(404, 'Документ не найден.');
    return doc;
  };
  const commitDocument = (document, actorUserId, action) => {
    // A synchronous single-process transaction: persist first, then publish
    // in-memory maps. No state is committed on encryption/disk failure.
    const nextDocs=new Map(documents),nextAudit=new Map(audit);
    const entry=Object.freeze({at:new Date().toISOString(),actorUserId,action,status:document.status});
    const history=[...(audit.get(document.id)||[]),entry];
    nextDocs.set(document.id,document);
    nextAudit.set(document.id,history);
    if(storage){
      try{storage.save({documents:nextDocs,audit:nextAudit});}
      catch{fail(503,'Не удалось сохранить учебный документ. Действие не выполнено.');}
    }
    documents=nextDocs;
    audit=nextAudit;
  };
  const attemptAllowed = bucket => {
    const now = Date.now();
    const current = attempts.get(bucket) || [];
    const recent = current.filter(t => now - t < LOGIN_WINDOW_MS);
    if (recent.length >= MAX_LOGIN_ATTEMPTS)
      fail(429, 'Слишком много попыток входа или активации.');
    recent.push(now); attempts.set(bucket, recent);
  };
  const loginAllowed=()=>attemptAllowed('login');
  const redeemAllowed=()=>attemptAllowed('redeem');

  const handler = async (req, res) => {
    try {
      // Defense in depth: refuse requests if a developer accidentally binds
      // this training server to a non-loopback network interface.
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.localAddress))
        fail(403,'Сервер разработки доступен только с этого компьютера.');
      if (req.headers.origin)
        fail(403, 'Браузерные запросы с чужого сайта запрещены.');
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const path = requestUrl.pathname;
      if (req.method === 'GET' && path === '/health') {
        send(res, 200, { ok:true, mode:'local-development', productionReady:false,
          backend:sqlite?'sqlite-experimental':storage?'encrypted-snapshot':'in-memory',
          encryptedFileEnabled:!!storage });
        return;
      }
      if (req.method === 'POST' && path === '/v1/sessions') {
        loginAllowed();
        const data = await readJson(req);
        // Demo owner/Elena remain bootstrapped by environment variables.
        // New fictional employees use an encrypted scrypt verifier stored
        // alongside their tenant membership in the local SQLite experiment.
        const account = users.get(data.login) ||
          (sqlite ? sqlite.trainingOnboarding.getAccount({
            organizationId,userId:data.login
          }) : null);
        // Perform a comparable KDF even for unknown logins.
        const fakeSalt = Buffer.alloc(16);
        const dummy = { salt: fakeSalt, passwordHash: secureHash('invalid-dev-account', fakeSalt) };
        const matches = checkPassword(account || dummy, data.password);
        if (!account || !matches) fail(401, 'Неверные данные входа.');
        if(sqlite){
          try{sqlite.getMembership({actor:{userId:account.userId},organizationId});}
          catch{fail(403,'Доступ к компании отозван.');}
        }else{
          const membership=memberships.get(account.userId);
          if(!membership||membership.status!=='active')
            fail(403,'Доступ к компании отозван.');
        }
        // The label is display-only: the server assigns the actual session ID.
        // No client-supplied role, organization, device ID or trusted device claim.
        const label = data.deviceLabel === undefined ? 'Учебное устройство' : data.deviceLabel;
        if (!isText(label, 60) || /[\r\n\t]/.test(label))
          fail(400, 'Некорректное имя учебного устройства.');
        const now = Date.now();
        for(const [digest, entry] of sessions) {
          if(entry.expiresAt <= now) sessions.delete(digest);
        }
        const active = Array.from(sessions.values()).filter(entry=>entry.userId===account.userId).length;
        if(active >= MAX_ACTIVE_SESSIONS_PER_USER)
          fail(429, 'Превышено число активных учебных сеансов.');
        const token = randomBytes(32).toString('base64url');
        const session = Object.freeze({
          id:randomUUID(), userId:account.userId, deviceLabel:label.trim(),
          createdAt:new Date(now).toISOString(), expiresAt:now + SESSION_MS
        });
        sessions.set(hashToken(token), session);
        send(res, 200, { token, tokenType:'Bearer', expiresInSeconds:SESSION_MS / 1000,
          user:{ id:account.userId, role:account.role, organizationId },
          session:{id:session.id,deviceLabel:session.deviceLabel,createdAt:session.createdAt,
            expiresAt:new Date(session.expiresAt).toISOString()} });
        return;
      }
      // Redeem without a session, but only with a single-use high-entropy code.
      // No connection to emails, real employees, or external devices.
      if(path==='/v1/invitations/accept'){
        if(req.method!=='POST')fail(405,'Метод не поддерживается.');
        if(storage)fail(501,'Учебные приглашения недоступны при сохранении снимков.');
        redeemAllowed();
        const data=await readJson(req);
        try{
          const joined=sqlite
            ?sqlite.trainingOnboarding.redeemInvitation({
              organizationId,code:data.code,password:data.password,
              makeEmployeeAccount:(userId,password)=>newAccount(userId,'employee',password)
            })
            :invitations.redeem({code:data.code,password:data.password});
          send(res,201,joined);return;
        }catch(error){
          if(error?.message==='Too many training invitation attempts.')
            fail(429,'Слишком много попыток активации.');
          fail(400,'Приглашение недействительно или данные не подходят.');
        }
      }
      const context = securityContext(req);
      // Every write revalidates the session after its asynchronous body read.
      // Revoking a session during an upload must prevent a queued mutation.
      const readAuthorizedJson=async()=>{
        const data=await readJson(req);
        securityContext(req);
        return data;
      };
      if (req.method === 'DELETE' && path === '/v1/sessions/current') {
        sessions.delete(hashToken(req.headers.authorization.slice(7)));
        send(res, 200, { ok:true });
        return;
      }
      if (req.method === 'GET' && path === '/v1/sessions') {
        const now=Date.now();
        const owned=[];
        for(const [digest, entry] of sessions){
          if(entry.expiresAt <= now) {
            sessions.delete(digest);
          } else if(entry.userId === context.actor.userId) {
            owned.push({
              id:entry.id,deviceLabel:entry.deviceLabel,createdAt:entry.createdAt,
              expiresAt:new Date(entry.expiresAt).toISOString(),
              current:entry.id===context.session.id
            });
          }
        }
        owned.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
        send(res,200,{sessions:owned});
        return;
      }
      // Revoke just one session of the authenticated account. In particular,
      // an owner cannot browse or revoke another employee's private sessions.
      const sessionMatch=/^\/v1\/sessions\/([0-9a-f-]{36})$/.exec(path);
      if(sessionMatch){
        if(req.method!=='DELETE') fail(405,'Метод не поддерживается.');
        let targetDigest;
        for(const [digest, entry] of sessions){
          if(entry.userId===context.actor.userId&&entry.id===sessionMatch[1]&&entry.expiresAt>Date.now()){
            targetDigest=digest;
            break;
          }
        }
        if(!targetDigest) fail(404,'Учебный сеанс не найден.');
        sessions.delete(targetDigest);
        send(res,200,{ok:true});
        return;
      }
      const invitationMatch=/^\/v1\/organizations\/([^/]+)\/invitations(?:\/([0-9a-f-]{36}))?$/.exec(path);
      if(invitationMatch){
        if(invitationMatch[1]!==context.membership.organizationId)fail(404,'Раздел не найден.');
        if(context.membership.role!=='owner')fail(403,'Доступ запрещён.');
        if(storage)fail(501,'Учебные приглашения недоступны при сохранении снимков.');
        if(!invitationMatch[2]&&req.method==='POST'){
          const data=await readAuthorizedJson();
          try{
            const result=sqlite
              ?sqlite.trainingOnboarding.createInvitation({
                actor:context.actor,organizationId,employeeLogin:data.employeeLogin
              })
              :invitations.create({
                actorUserId:context.actor.userId,employeeLogin:data.employeeLogin
              });
            send(res,201,result);return;
          }catch(error){
            if(error?.message==='Too many pending training invitations.')
              fail(409,'Достигнут предел учебных приглашений.');
            fail(400,'Неверное имя учебного сотрудника или приглашение уже существует.');
          }
        }
        if(invitationMatch[2]&&req.method==='DELETE'){
          try{
            if(sqlite)sqlite.trainingOnboarding.cancelInvitation({
              actor:context.actor,organizationId,invitationId:invitationMatch[2]
            });
            else invitations.cancel({
              actorUserId:context.actor.userId,invitationId:invitationMatch[2]
            });
            send(res,200,{ok:true});return;
          }catch{fail(404,'Учебное приглашение не найдено.');}
        }
        fail(405,'Метод не поддерживается.');
      }
      const memberMatch=/^\/v1\/organizations\/([^/]+)\/members(?:\/([a-z][a-z0-9_-]{2,31}))?$/.exec(path);
      if(memberMatch){
        if(memberMatch[1]!==context.membership.organizationId)fail(404,'Раздел не найден.');
        if(context.membership.role!=='owner')fail(403,'Доступ запрещён.');
        if(storage)fail(501,'Учебное управление сотрудниками недоступно при сохранении снимков.');
        if(!memberMatch[2]&&req.method==='GET'){
          const members=sqlite
            ?sqlite.trainingOnboarding.listMembers({actor:context.actor,organizationId})
            :invitations.members({actorUserId:context.actor.userId});
          send(res,200,{members});
          return;
        }
        if(memberMatch[2]&&req.method==='DELETE'){
          try{
            if(sqlite){
              sqlite.trainingOnboarding.revokeMember({
                actor:context.actor,organizationId,userId:memberMatch[2]
              });
              for(const [digest,session] of sessions)
                if(session.userId===memberMatch[2])sessions.delete(digest);
            }else invitations.revoke({
              actorUserId:context.actor.userId,userId:memberMatch[2]
            });
            send(res,200,{ok:true});return;
          }catch{fail(404,'Учебный сотрудник не найден.');}
        }
        fail(405,'Метод не поддерживается.');
      }
      // Authenticated local work-space bootstrap. Never accept actor/tenant
      // IDs from query parameters or reveal other members.
      if (req.method === 'GET' && path === '/v1/workspace') {
        if(requestUrl.search)fail(400,'Неожиданные параметры.');
        send(res,200,{
          personalUnaffected:true,
          work:{
            organizationId:context.membership.organizationId,
            userId:context.actor.userId,
            role:context.membership.role,
            status:'active'
          },
          serverVerified:true,
          trainingOnly:true
        });
        return;
      }
      if (req.method === 'GET' && path === '/v1/organizations') {
        send(res, 200, { organizations:[{ id:context.membership.organizationId, role:context.membership.role }] });
        return;
      }
      // Durable, recipient-only event cursor for a future mobile client.
      // No document title/body and no user selector is accepted from the URL.
      const changeMatch=/^\/v1\/organizations\/([^/]+)\/updates$/.exec(path);
      if(changeMatch){
        if(req.method!=='GET')fail(405,'Метод не поддерживается.');
        if(changeMatch[1]!==context.membership.organizationId)fail(404,'Раздел не найден.');
        if(!sqlite)fail(501,'События доступны только в учебном режиме SQLite.');
        const raw=requestUrl.searchParams.get('after')??'0';
        if(!/^(?:0|[1-9][0-9]{0,14})$/.test(raw)||
            Array.from(requestUrl.searchParams.keys()).some(k=>k!=='after')||
            requestUrl.searchParams.getAll('after').length>1)
          fail(400,'Некорректный курсор обновлений.');
        try{
          const changes=sqlite.getUpdates({
            actor:context.actor,organizationId:context.membership.organizationId,
            after:Number(raw),limit:50
          });
          send(res,200,changes);return;
        }catch{
          fail(503,'События документов недоступны.');
        }
      }
      // Polling mailbox for two separate authenticated local test sessions.
      // No request parameter may select another person's inbox/outbox.
      const mailboxMatch=/^\/v1\/organizations\/([^/]+)\/(inbox|outbox)$/.exec(path);
      if(mailboxMatch){
        if(req.method!=='GET')fail(405,'Метод не поддерживается.');
        const [,tenant,folder]=mailboxMatch;
        if(tenant!==context.membership.organizationId)
          fail(404,'Раздел не найден.');
        let visible;
        try {
          visible=sqlite
            ?sqlite.listDocuments({actor:context.actor,organizationId:tenant})
            :Array.from(documents.values())
              .filter(doc=>canReadDocument({...context,document:doc}))
              .map(meta);
          const projected=projectDocumentMailbox({
            documents:visible,actor:context.actor,membership:context.membership,
            organizationId:tenant,folder
          });
          const etag=mailboxTag({
            masterKey,actor:context.actor,organizationId:tenant,mailbox:projected
          });
          if(mailboxUnchanged(req.headers['if-none-match'],etag)){
            res.writeHead(304,{
              'ETag':etag,
              'Cache-Control':'private, no-store, max-age=0',
              'X-Content-Type-Options':'nosniff'
            });
            res.end();return;
          }
          send(res,200,projected,{
            'ETag':etag,
            'Cache-Control':'private, no-store, max-age=0'
          });return;
        } catch {
          fail(503,'Входящие документы временно недоступны.');
        }
      }
      const match = /^\/v1\/organizations\/([^/]+)\/documents(?:\/([^/]+))?(?:\/(actions|audit))?$/.exec(path);
      if (!match) fail(404, 'Маршрут не найден.');
      const [, tenant, id, operation] = match;
      // Tenant isolation: never trust the ID from the URL as proof of membership.
      if (tenant !== context.membership.organizationId) fail(404, 'Документ не найден.');
      if(sqlite){
        const invoke=fn=>{
          try{return fn();}
          catch(error){
            if(error?.message==='Access denied or resource unavailable.')
              fail(404,'Документ не найден или действие запрещено.');
            if(error?.message==='Development document limit reached.')
              fail(409,'Достигнут предел учебных документов.');
            fail(503,'База разработки недоступна.');
          }
        };
        if(!id&&!operation&&req.method==='GET'){
          send(res,200,{documents:invoke(()=>sqlite.listDocuments({
            actor:context.actor,organizationId:tenant
          }))});
          return;
        }
        if(!id&&!operation&&req.method==='POST'){
          if(!canCreateDocument({...context,organizationId:tenant}))
            fail(403,'Нет права создавать документы.');
          const data=await readAuthorizedJson();
          if(!['acknowledgement','approval'].includes(data.type)||
            !isText(data.title,120)||!isText(data.body,8000)||
            typeof data.recipientUserId!=='string')
            fail(400,'Некорректные поля документа.');
          const document=invoke(()=>sqlite.createDocument({
            actor:context.actor,organizationId:tenant,
            recipientUserId:data.recipientUserId,type:data.type,
            title:data.title,body:data.body
          }));
          send(res,201,{document});return;
        }
        if(!id)fail(404,'Маршрут не найден.');
        if(!operation&&req.method==='GET'){
          send(res,200,{document:invoke(()=>sqlite.getDocument({
            actor:context.actor,organizationId:tenant,documentId:id
          }))});return;
        }
        if(operation==='audit'&&req.method==='GET'){
          send(res,200,{events:invoke(()=>sqlite.getAudit({
            actor:context.actor,organizationId:tenant,documentId:id
          }))});return;
        }
        if(operation==='actions'&&req.method==='POST'){
          const data=await readAuthorizedJson();
          if(!Object.hasOwn(nextState,data.action))fail(403,'Это действие недоступно.');
          send(res,200,{document:invoke(()=>sqlite.transition({
            actor:context.actor,organizationId:tenant,documentId:id,action:data.action
          }))});return;
        }
        fail(405,'Метод не поддерживается.');
      }
      if (!id && !operation && req.method === 'GET') {
        const result = Array.from(documents.values()).filter(d =>
          canReadDocument({ ...context, document:d })).map(meta);
        send(res, 200, { documents:result });
        return;
      }
      if (!id && !operation && req.method === 'POST') {
        if (!canCreateDocument({ ...context, organizationId:tenant })) fail(403, 'Нет права создавать документы.');
        if (documents.size >= MAX_DOCS) fail(409, 'Достигнут предел локального прототипа.');
        const data = await readAuthorizedJson();
        if (!['acknowledgement','approval'].includes(data.type) ||
            !isText(data.title, 120) || !isText(data.body, 8000) ||
            typeof data.recipientUserId !== 'string')
          fail(400, 'Некорректные поля документа.');
        const recipient = memberships.get(data.recipientUserId);
        if (!recipient || recipient.status !== 'active' || recipient.organizationId !== tenant ||
            recipient.userId === context.actor.userId) fail(400, 'Получатель не найден.');
        const now = new Date().toISOString();
        const document = {
          id:randomUUID(), organizationId:tenant, creatorUserId:context.actor.userId,
          recipientUserId:recipient.userId, type:data.type,
          title:data.title.trim(), status:'sent', createdAt:now, updatedAt:now,
          sealed:encryptedContent(data.body, masterKey)
        };
        commitDocument(document, context.actor.userId, 'created');
        send(res, 201, { document:meta(document) });
        return;
      }
      if (!id) fail(404, 'Маршрут не найден.');
      const document = loadDocument(id, context);
      if (!operation && req.method === 'GET') {
        send(res, 200, { document:{...meta(document),body:decryptedContent(document.sealed,masterKey)} });
        return;
      }
      if (operation === 'audit' && req.method === 'GET') {
        if (!canReadDocumentAudit({ ...context, document })) fail(404, 'Документ не найден.');
        send(res, 200, { events:audit.get(document.id)||[] });
        return;
      }
      if (operation === 'actions' && req.method === 'POST') {
        const data = await readAuthorizedJson();
        if (!Object.hasOwn(nextState, data.action) ||
          !canTransitionDocument({ ...context, document, action:data.action }))
          fail(403, 'Это действие недоступно.');
        // Never mutate a persisted record before the new snapshot is durable.
        const nextDocument={...document,status:nextState[data.action],updatedAt:new Date().toISOString()};
        commitDocument(nextDocument, context.actor.userId, data.action);
        send(res, 200, { document:meta(nextDocument) });
        return;
      }
      fail(405, 'Метод не поддерживается.');
    } catch (error) {
      send(res, error instanceof HttpProblem ? error.status : 500,
        { error:error instanceof HttpProblem ? error.message : 'Внутренняя ошибка сервера.' });
    }
  };
  const server=createServer(handler);
  // An accidental server.listen(port) binds all interfaces on Node.js.
  // Refuse that *before* opening a socket, even if callers bypass the CLI.
  const originalListen=server.listen;
  server.listen=function(...args){
    const options=args[0];
    const host=options&&typeof options==='object' ? options.host : args[1];
    if(host!=='127.0.0.1'&&host!=='::1')
      throw new Error('Secure Documents development API requires an explicit loopback bind (127.0.0.1 or ::1).');
    return originalListen.apply(this,args);
  };
  if(sqlite)server.on('close',()=>sqlite.close());
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.SEYVEO_DEV_SERVER !== '1' || process.env.NODE_ENV === 'production') {
    console.error('Only explicit local development mode is allowed. Set SEYVEO_DEV_SERVER=1.');
    process.exit(1);
  }
  const raw = process.env.SEYVEO_DEV_MASTER_KEY_B64 || '';
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    console.error('Set SEYVEO_DEV_MASTER_KEY_B64 to a random base64-encoded 32-byte key.');
    process.exit(1);
  }
  try {
    const server = createDevDocumentServer({
      ownerPassword:process.env.SEYVEO_DEV_OWNER_PASSWORD,
      employeePassword:process.env.SEYVEO_DEV_EMPLOYEE_PASSWORD,
      masterKey:key,
      storagePath:process.env.SEYVEO_DEV_STORE_PATH||undefined,
      sqlitePath:process.env.SEYVEO_DEV_SQLITE_PATH||undefined
    });
    const port = Number(process.env.SEYVEO_DEV_PORT || '8787');
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port.');
    server.listen(port, '127.0.0.1', () =>
      console.info('SEYVEO local development API: 127.0.0.1:' + port + ' (not for production)'));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
