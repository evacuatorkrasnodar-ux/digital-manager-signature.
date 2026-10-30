/* SEYVEO: explicit, local-only conversational memory commands.
 * No auto-learning from conversations and no external network requests.
 */
export function memoryCommand(message){
 if(typeof message!=='string')return null;
 const match=message.trim().match(/^(?:(?:сэй|сэйви)[,!\s]+)?(?:запомни|сохрани в память|запиши в память)\s*[:—,-]\s*(.{1,500})$/isu);
 if(!match)return null;
 return {action:'add',text:match[1].trim()};
}
export function memoryResultText({duplicate=false}={}){
 return duplicate?'Я уже сохранила это в своей локальной памяти.':'Запомнила. Я сохранила эту заметку только на твоём компьютере. Ты можешь удалить её в разделе памяти.';
}
