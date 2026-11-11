/* SEYVEO · model-facing capability policy.
 * The model may reason about tools, but CANNOT execute them.
 * Local/browser data never enters the model merely because a tool exists.
 */
const tools=Object.freeze([
 Object.freeze({id:'tasks.read',scope:'life',availability:'ask-first',description:'Read local personal tasks only after explicit data sharing'}),
 Object.freeze({id:'calendar.read',scope:'life',availability:'ask-first',description:'Read local calendar entries only after explicit data sharing'}),
 Object.freeze({id:'task.create',scope:'life',availability:'user-command',description:'Add a local task through the existing validated Tasks handler'}),
 Object.freeze({id:'calendar.create',scope:'life',availability:'user-command',description:'Add an event through the existing validated Calendar handler'}),
 Object.freeze({id:'note.create',scope:'life',availability:'user-command',description:'Save a local note through the existing Notebook handler'}),
 Object.freeze({id:'business.read',scope:'business',availability:'not-connected',description:'Connected business records with verified role permissions'}),
 Object.freeze({id:'lab.draft',scope:'lab',availability:'proposal-only',description:'Describe an extension for SEYVEO LAB; cannot install or publish'})
]);
export function capabilityPolicy(){
 return tools.map(({id,scope,availability,description})=>({id,scope,availability,description}));
}
export function modelToolGuidance(){
 return [
  'Инструменты SEYVEO. Это сведения о доступных механизмах, а НЕ данные пользователя и НЕ разрешение выполнять действия.',
  'Ты можешь свободно рассуждать и предлагать конкретную помощь своими словами; не используй словарь шаблонных ответов.',
  'Только заявленные рабочие действия: календарь, личные дела и заметки через существующие обработчики приложения. Для явной команды пользователя, например «запиши дело», обычный интерфейс использует проверяемый локальный обработчик. Если он не подтвердил сохранение, НЕ говори «готово».',
  'Нет прямого доступа к чужим личным данным, невложенным файлам, браузеру и внешним сервисам. Однако можешь писать ПОЛНЫЕ тексты новых документов: в чате SEYVEO есть отдельные реальные кнопки просмотра, скачивания Word (.docx), PDF и печати из подготовленного текста. Не путай отсутствие прямой отправки чужих файлов с возможностью создавать текст и экспортировать документ.',
  'Отправка почты, платежи, публикации, изменение прав доступа и установка расширений в этом маршруте недоступны. Но подготовить полноценный текст нового документа — рабочая функция; пользователь самостоятельно запускает экспорт через интерфейс. Не утверждай, что экспорт уже выполнен.',
  'Никогда не выводи машинную команду выполнения и не заявляй об исполнении инструмента: модель отвечает ТОЛЬКО текстом. Запись — через существующий отдельный обработчик и с разрешения пользователя.',
  'Если задача сложная, начни выполнять доступную часть немедленно. Спрашивай только недостающие критичные сведения; для отсутствующих реквизитов в документе используй явно подписанные поля. Не обещай автоматических фоновых действий.',
  'Рабочие возможности: '+tools.filter(t=>t.availability==='user-command').map(t=>t.id).join(', ')+'.',
  'Пока не подключено: '+tools.filter(t=>t.availability==='not-connected').map(t=>t.id).join(', ')+'.'
 ].join('\n');
}
