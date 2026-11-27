// Fixed public metadata endpoint; no API key, audio, redirects or user-provided URLs.
export async function lookupMusicReleases(artist,{fetchImpl=fetch}={}){
 if(typeof artist!=='string'||!artist.trim()||artist.length>100||/[\u0000-\u001f\u007f]/.test(artist))throw Error('invalid-artist');
 const url=new URL('https://itunes.apple.com/search');
 for(const [key,value] of Object.entries({term:artist.trim(),country:'US',media:'music',entity:'album',attribute:'artistTerm',limit:'60'}))url.searchParams.set(key,value);
 const response=await fetchImpl(url,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw Error('catalog-unavailable');
 const reader=response.body?.getReader();if(!reader)throw Error('catalog-unavailable');
 let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024*1024)throw Error('catalog-too-large');chunks.push(value)}}
 finally{await reader.cancel().catch(()=>{})}
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!Array.isArray(data.results))throw Error('catalog-invalid');
 return {results:data.results.slice(0,60).map(r=>({wrapperType:r?.wrapperType,collectionType:r?.collectionType,artistName:r?.artistName,artistId:r?.artistId,collectionId:r?.collectionId,collectionName:r?.collectionName,collectionViewUrl:r?.collectionViewUrl,releaseDate:r?.releaseDate}))};
}
