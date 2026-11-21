/* Refresh the same-origin SEYVEO weather snapshot for the prototype city.
   Open-Meteo's public endpoint is used only during prototype evaluation. */
import {writeFile} from 'node:fs/promises';

const endpoint=new URL('https://api.open-meteo.com/v1/forecast');
endpoint.searchParams.set('latitude','45.0355');
endpoint.searchParams.set('longitude','38.9753');
endpoint.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max');
endpoint.searchParams.set('current','temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure,pressure_msl,is_day');
endpoint.searchParams.set('hourly','temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index');

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

/* Guard every published dynamic value, so the client never treats a
   malformed or partial hourly feed as verified live meteorological data. */
const hourly=payload?.hourly;
const requiredHourly=['time','temperature_2m','relative_humidity_2m','precipitation_probability',
 'weather_code','wind_speed_10m','wind_direction_10m','pressure_msl','uv_index'];
if(!requiredHourly.every(key=>Array.isArray(hourly?.[key])&&hourly[key].length===hourly.time?.length)
 ||hourly.time.length<24||hourly.time.some((time,i)=>
  !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)||
  !Number.isFinite(hourly.temperature_2m[i])||
  !Number.isFinite(hourly.weather_code[i])))
 throw new Error('Invalid hourly meteorological response');
if(!payload?.current||!Number.isFinite(payload.current.temperature_2m)||
 !Number.isFinite(payload.current.weather_code)||
 !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(payload.current.time||''))
 throw new Error('Invalid current meteorological response');

payload.fetched_at=new Date().toISOString();
const path=new URL('../assets/seyveo-weather-krasnodar.json',import.meta.url);
await writeFile(path,JSON.stringify(payload,null,2)+'\n','utf8');
console.log('Updated SEYVEO weather for',daily.time[0],'through',daily.time.at(-1));
