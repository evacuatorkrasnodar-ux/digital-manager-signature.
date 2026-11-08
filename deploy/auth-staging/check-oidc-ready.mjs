/**
 * SEYVEO operator-only staging discovery check, NOT a login test.
 *
 * Fetches PUBLIC Keycloak OIDC metadata and PUBLIC signing keys using an
 * operator-owned HTTPS host from a validated PRIVATE .env.
 * Does not use admin credentials, print secrets, authenticate users,
 * enable registration, deploy anything or write to the provider.
 *
 * A successful result means only the advertised public endpoints / RS256
 * signing keys and native PKCE/RFC 9207 metadata passed the gate.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createDiscoveredOidcAccessVerifier}
  from '../../server/business-identity/oidc-discovery-verifier.mjs';
import {validateStagingFile} from './validate-staging.mjs';

const HOST=/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const DENY=/\.(?:invalid|example|test|localhost|local|internal)$/;
const BLOCKED=Object.freeze({status:'blocked'});
const READY=Object.freeze({status:'public-oidc-ready'});
const trustedHost=host=>typeof host==='string'&&
  host.length<=253&&HOST.test(host)&&!DENY.test(host);

export function createStagingOidcReadiness({
  authHost,fetchImpl=fetch,now=Date.now
}={}){
  if(!trustedHost(authHost)||typeof fetchImpl!=='function'||
     typeof now!=='function')
    throw new TypeError('An operator-controlled HTTPS auth host is required.');
  const issuer='https://'+authHost+'/realms/seyveo';
  const verifier=createDiscoveredOidcAccessVerifier({
    issuer,audience:'seyveo-api',clientId:'seyveo-native',
    // The readiness probe MUST NEVER accept a real access token.
    resolvePerson:async()=>null,isRevoked:async()=>true,
    fetchImpl,now,cacheMs:10_000
  });

  async function check(){
    try{
      const config=await verifier.getTrustedProviderConfig();
      if(!config||config.issuer!==issuer||
         config.authorizationResponseIssuerSupported!==true)
        return BLOCKED;
      // Strict OIDC discovery already validates code + PKCE S256, exact
      // issuer origin, bounded JSON, HTTPS endpoints and public RSA keys.
      return READY;
    }catch{return BLOCKED;}
  }
  return Object.freeze({check});
}

function hostFromValidatedPrivateEnv(file){
  validateStagingFile(file);
  const line=readFileSync(file,'utf8').split(/\r?\n/)
    .find(x=>x.startsWith('SEYVEO_AUTH_HOST='));
  const host=line?.slice('SEYVEO_AUTH_HOST='.length);
  if(!trustedHost(host))throw new Error('Untrusted staging host.');
  return host;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  try{
    if(process.argv.length!==3)throw new Error('Private config path required.');
    const host=hostFromValidatedPrivateEnv(process.argv[2]);
    const result=await createStagingOidcReadiness({authHost:host}).check();
    if(result.status!=='public-oidc-ready')
      throw new Error('OIDC discovery blocked.');
    process.stdout.write(
      'Public OIDC metadata and key readiness: PASS. Actual login, SMTP, API tokens and production security remain unverified.\n'
    );
  }catch{
    // Do NOT print remote URLs, response bodies, hosts, private .env or keys.
    process.stderr.write(
      'Public OIDC readiness: BLOCKED. No credentials or provider details were printed.\n'
    );
    process.exitCode=1;
  }
}
