/* Refresh the same-origin SEYVEO weather snapshot for the prototype city.
   Open-Meteo's public endpoint is used only during prototype evaluation. */
import {writeFile} from 'node:fs/promises';

const endpoint=new URL('https://api.open-meteo.com/v1/forecast');
endpoint.searchParams.set('latitude','45.0355');
endpoint.searchParams.set('longitude','38.9753');
endpoint.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min');
endpoint.searchParams.set('timezone','Europe/Moscow');
endpoint.searchParams.set('forecast_days','7');

const response=await fetch(endpoint,{signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error('Weather request failed: '+response.status);
const payload=await response.json();
const daily=payload?.daily;
if(!Array.isArray(daily?.time)||!Array.isArray(daily?.weather_code)||
   !Array.isArray(daily?.temperature_2m_max)||!Array.isArray(daily?.temperature_2m_min)||
   daily.time.length<3||daily.time.some((day,index)=>
    !/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(daily.weather_code[index])||
    !Number.isFinite(daily.temperature_2m_max[index])||!Number.isFinite(daily.temperature_2m_min[index])))
 throw new Error('Invalid daily weather response');

payload.fetched_at=new Date().toISOString();
const path=new URL('../assets/seyveo-weather-krasnodar.json',import.meta.url);
await writeFile(path,JSON.stringify(payload,null,2)+'\n','utf8');
console.log('Updated SEYVEO weather for',daily.time[0],'through',daily.time.at(-1));
