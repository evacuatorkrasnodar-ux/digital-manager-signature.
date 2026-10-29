export const questions=[
 ['idea','Какое дело хотите открыть?'],
 ['city','В каком городе?'],
 ['budget','Какой примерный бюджет?'],
 ['premises','Есть ли помещение?'],
 ['team','Будете работать один или с командой?']
];
export function nextStep(answers={}){
 const question=questions.find(([key])=>!String(answers[key]??'').trim());
 return question?{key:question[0],title:question[1]}:{key:'plan',title:'Составить предварительную смету'};
}
