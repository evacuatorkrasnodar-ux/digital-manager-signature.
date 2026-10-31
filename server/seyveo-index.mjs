import {loadKnowledgeLibrary,retrieveKnowledge} from './knowledge-engine.mjs';
import {join} from 'node:path';
export async function searchLocalIndex(query,root){
 const docs=await loadKnowledgeLibrary({directory:join(root,'knowledge','approved')});
 return retrieveKnowledge(String(query).slice(0,600),docs,{limit:4}).map(x=>({title:x.title,source:x.source,excerpt:x.text.slice(0,450),updated:x.updated||null}));
}
