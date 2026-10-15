import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type City, type CityResource, type CitySearch, type CityCollection, type CityDistance, type CityRelations, type CityOptions, type CityNearest, type CityNearestOptions } from '../src/index.js';

it('preserves complete classic and canonical City facts, including nulls and valid zero', async () => {
  const calls:URL[]=[];
  const core:City={id:'city_7aj899nvwyku',name:'Vienna',name_local:'Wien',type:'city',state:'9',state_name:'Vienna',district:null,district_name:null,country:'AT',country_name:'Austria',latitude:48.2082,longitude:16.3738,timezone:'Europe/Vienna',deep:{population:0}};
  const complete:CityResource={...core,object:'city'};
  expectTypeOf<CityResource>().toMatchTypeOf<City>();
  const parse=parseAPI('fixture',{fetch:async input=>{const url=new URL(String(input));calls.push(url);const result=url.searchParams.has('q')?{q:url.searchParams.get('q'),cities:[core]}:url.searchParams.has('lat')?{...(url.searchParams.get('format')==='resource'?complete:core),distance:0,distance_mi:0}:url.searchParams.get('format')==='resource'?complete:core;return new Response(JSON.stringify(result));}});
  expectTypeOf(await parse.city('Vienna',{country:'AT'})).toEqualTypeOf<City>();
  expectTypeOf(await parse.city.search('Vi',{country:'AT'})).toEqualTypeOf<CitySearch>();
  const result=await parse.city.id('city_7aj899nvwyku',{format:'resource',deep:true});
  expectTypeOf(result).toEqualTypeOf<CityResource>(); expect(result).toEqual(complete); expect(result.country).toBe('AT'); expect(result.district).toBeNull(); expect(result.deep?.population).toBe(0);
  expect(Object.fromEntries(calls[2]!.searchParams)).toEqual({format:'resource',deep:'true'});
  const raw=await parse.city('Vienna',{format:'resource'});expect(raw.name_local).toBe('Wien');
  const options:CityOptions={country:'AT'};
  expectTypeOf(await parse.city('Vienna',options)).toEqualTypeOf<City>();
  const nearestOptions:CityNearestOptions={country:'AT'};
  const nearest=await parse.city.nearest(48.2082,16.3738,nearestOptions);
  expectTypeOf(nearest).toEqualTypeOf<CityNearest>(); expect(nearest.distance).toBe(0);
  expectTypeOf(await parse.city.nearest(48.2082,16.3738,{format:'resource'})).toEqualTypeOf<CityResource & Pick<CityNearest,'distance'|'distance_mi'>>();
});

it('forwards zero and negative filters, CSV arrays and multi-term sorting without reinterpreting opaque cursors',async()=>{
  const calls:URL[]=[];const body:CityCollection={object:'list',data:[],has_more:true,url:'/city',next_cursor:'opaque+/=?&'};
  const parse=parseAPI('fixture',{fetch:async input=>{calls.push(new URL(String(input)));return new Response(JSON.stringify(body));}});
  const opts={countries:['AT','CH'],excludeCountries:['JP'],timezones:['Europe/Vienna','Europe/Zurich'],minElevation:-10,maxElevation:0,minPopulation:0,sort:'country,-population,name',cursor:'opaque+/=?&'};
  expect(await parse.city.list(opts)).toEqual(body);
  expect(Object.fromEntries(calls[0]!.searchParams)).toEqual({browse:'true',format:'list',countries:'AT,CH',exclude_countries:'JP',timezones:'Europe/Vienna,Europe/Zurich',min_elevation:'-10',max_elevation:'0',min_population:'0',sort:'country,-population,name',cursor:'opaque+/=?&'});
  expectTypeOf(await parse.city.search('Vi',{format:'list',})).toEqualTypeOf<CityCollection>();
  await parse.city.nearby('Vienna',{format:'list',});
  expect(calls[1]!.searchParams.get('format')).toBe('list');expect(calls[2]!.searchParams.get('format')).toBe('list');
});

it('retains partial relationship context and forwards cursor through all reviewed traversal calls',async()=>{
  const calls:URL[]=[];const body:CityRelations={object:'list',data:[],has_more:false,url:'/city/id/city_7aj899nvwyku/children',next_cursor:null,city_id:'city_7aj899nvwyku',relationship:'children',coverage:'partial'};
  const parse=parseAPI('fixture',{fetch:async input=>{calls.push(new URL(String(input)));return new Response(JSON.stringify(body));}});
  expect(await parse.city.children('city_7aj899nvwyku',{cursor:'opaque+/=',limit:2,hierarchy:true,deep:true,lang:'de'})).toEqual(body);
  await parse.city.ancestors('city_7aj899nvwyku',{});await parse.city.siblings('city_7aj899nvwyku',{limit:2});
  expect(calls.map(url=>url.pathname)).toEqual(['/city/id/city_7aj899nvwyku/children','/city/id/city_7aj899nvwyku/ancestors','/city/id/city_7aj899nvwyku/siblings']);
  expect(Object.fromEntries(calls[0]!.searchParams)).toEqual({cursor:'opaque+/=',limit:'2',hierarchy:'true',deep:'true',lang:'de'});
  expect(calls[1]!.searchParams.has('limit')).toBe(false);expect(calls[1]!.searchParams.has('cursor')).toBe(false);
});

it.each([0,null])('keeps City distance %s and its great-circle method intact',async distance=>{
  const body:CityDistance={object:'city_distance',from:'city_7aj899nvwyku',to:'city_7aj899nvwyku',distance,distance_mi:distance,method:'great_circle'};
  const parse=parseAPI('fixture',{fetch:async input=>{const url=new URL(String(input));expect(url.pathname).toBe('/city/id/city_7aj899nvwyku/distance/city_7aj899nvwyku');expect(url.search).toBe('');return new Response(JSON.stringify(body));}});
  expect(await parse.city.distance(body.from,body.to)).toEqual(body);
});

it('retains bounded City ambiguity identities without changing the existing error constructor or unrelated errors',async()=>{
  const {ParseAPIError}=await import('../src/index.js');
  expect(Object.hasOwn(new ParseAPIError(400,'invalid_request','Input',null,null),'candidates')).toBe(false);
  const safe={id:'city_7aj899nvwyku',object:'city',name:'Vienna',name_local:'Wien',country:'AT',state:null};
  for(const [status,code] of [[409,'ambiguous_city'],[409,'conflict'],[400,'ambiguous_city'],[429,'rate_limited']] as const) {
    let calls=0;
    const parse=parseAPI('fixture',{fetch:async()=>{calls++;return new Response(JSON.stringify({code,message:'Choose a city',docs:null,request_id:'req_city',candidates:[{...safe,deep:{population:99},internal_id:1},safe,safe]}),{status,headers:{'Retry-After':'60'}});}});
    try {await parse.city('Vienna',{ambiguity:'error'});expect.fail('Expected an API error');}
    catch(error){
      expect(error).toBeInstanceOf(ParseAPIError);const err=error as InstanceType<typeof ParseAPIError>;
      expect(err.retryAfter).toBe('60');expect(err.requestId).toBe('req_city');
      if(status===409&&code==='ambiguous_city'){expect(err.candidates).toEqual([safe,safe]);expect(err.candidates?.[0]).not.toHaveProperty('deep');}
      else expect(Object.hasOwn(err,'candidates')).toBe(false);
    }
    expect(calls).toBe(1);
  }
});

it('forwards explicit fuzzy matching and retains match evidence without changing default search',async()=>{
 const body={object:'list',data:[{id:'city_7aj899nvwyku',object:'city',match:{type:'fuzzy',source:'name',value:'Vienna',language:null,edit_distance:1}}],has_more:false,url:'/city',next_cursor:null};const urls:URL[]=[];
 const parse=parseAPI('fixture',{fetch:async input=>{urls.push(new URL(String(input)));return new Response(JSON.stringify(body));}});const result=await parse.city.search('Viena',{match:'fuzzy',maxDistance:1,format:'list'});expect(result.data[0]?.match?.edit_distance).toBe(1);expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({q:'Viena',match:'fuzzy',max_distance:'1',format:'list'});await parse.city.search('Vi');expect(Object.fromEntries(urls[1]!.searchParams)).toEqual({q:'Vi'});
});


it('opts into reviewed romanization without folding native text or changing default lookup',async()=>{
 const urls:URL[]=[];let name:string|null='Kitakyūshū';const parse=parseAPI('fixture',{fetch:async input=>{urls.push(new URL(String(input)));return new Response(JSON.stringify({id:'city_7aj899nvwyku',object:'city',name_romanized:name,romanization_language:name?'ja-Latn':null}));}});
 expect((await parse.city.id('city_7aj899nvwyku',{format:'resource',romanized:true})).name_romanized).toBe('Kitakyūshū');expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({format:'resource',romanized:'true'});name=null;expect((await parse.city.id('city_7aj899nvwyku',{format:'resource',romanized:true})).name_romanized).toBeNull();await parse.city('Vienna');expect(urls[2]!.search).toBe('');
});

it('routes explicit spelling to the dedicated index and adapts only the classic envelope',async()=>{
 const calls:URL[]=[]; const row={id:'city_7aj899nvwyku',object:'city',name:'Vienna'};
 const parse=parseAPI('fixture',{fetch:async input=>{const url=new URL(String(input));calls.push(url);return new Response(JSON.stringify(url.pathname==='/city/search'?{object:'list',data:[row],q:'Viena',has_more:false,url:'/city/search',next_cursor:null}:{q:'Vi',cities:[row]}));}});
 const classic=await parse.city.search('Viena',{match:'fuzzy',maxDistance:1});expect(classic.cities).toEqual([row]);expect(classic.q).toBe('Viena');expect(calls[0]!.pathname).toBe('/city/search');
 expect((await parse.city.search('Viena',{match:'fuzzy',format:'list'})).data).toEqual([row]);expect(calls[1]!.pathname).toBe('/city/search');
 expect((await parse.city.search('Vi')).cities).toEqual([row]);expect(calls[2]!.pathname).toBe('/city');
});
