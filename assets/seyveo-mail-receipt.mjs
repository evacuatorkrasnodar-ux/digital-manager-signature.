/* Verified mail outcome adapter. No SMTP credentials or fake success here. */
export function validateMailReceipt(receipt){
 if(!receipt||typeof receipt!=='object')throw Error('Mail receipt required');
 if(receipt.status!=='sent')throw Error('Mail provider did not confirm sending');
 if(typeof receipt.provider!=='string'||!receipt.provider.trim())throw Error('Mail provider missing');
 if(typeof receipt.messageId!=='string'||!receipt.messageId.trim())throw Error('Provider message ID missing');
 if(typeof receipt.recipient!=='string'||!receipt.recipient.includes('@'))throw Error('Recipient missing');
 if(typeof receipt.sentAt!=='string'||!Number.isFinite(Date.parse(receipt.sentAt)))throw Error('Send timestamp missing');
 if(receipt.demo===true||receipt.simulated===true)throw Error('Demo receipt cannot confirm delivery');
 return Object.freeze({provider:receipt.provider.trim(),messageId:receipt.messageId.trim(),recipient:receipt.recipient.trim(),sentAt:receipt.sentAt});
}
export function confirmedMailResult(api,key,receipt){
 const verified=validateMailReceipt(receipt);
 const card=api.complete(key,{acknowledged:true,reason:'Provider confirmed '+verified.provider+' / '+verified.messageId});
 return {card,receipt:verified};
}
