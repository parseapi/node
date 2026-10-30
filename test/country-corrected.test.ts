import {readFileSync} from 'node:fs';
import {expect,it,expectTypeOf} from 'vitest';
import {parseAPI,type Country,type CountryCapital,type CountryTax} from '../src/index.js';
const fixture=(name:string)=>JSON.parse(readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8'));
const full=fixture('country-corrected.json'),aq=fixture('country-aq.json'),de=fixture('country-de.json');
it('returns the actual Country flag and capital/tax groups in one request',async()=>{
 let calls=0;const client=parseAPI('fixture',{fetch:async()=>{calls++;return new Response(JSON.stringify(full));}});
 const c=await client.country('US',{deep:true});expect(calls).toBe(1);expect(c).toEqual(full);expect(c.flag).toBe('🇺🇸');expect(c.name_full).toBe('United States of America');expect(c.demonym).toBe('American');expect(c.capital).toEqual({name:'Washington, D.C.',lat:38.89,lon:-77.05});
 expect(c.deep?.tax).toEqual({name:null,rate:null});expect(c.deep?.population).toBe(full.deep.population);expect(c.deep?.area).toBe(full.deep.area);
 for(const key of ['emoji','full_name','capital_lat','capital_lon','population','area'])expect(c).not.toHaveProperty(key);
 for(const key of ['iso3','numeric','name_full','full_name','demonym','region','subregion','capital','capital_lat','capital_lon','borders','blocs','tax_rate','tax_id_format','tax_id_regex'])expect(c.deep).not.toHaveProperty(key);
 expect(Object.keys(c).at(-1)).toBe('deep');expectTypeOf<Country['languages']>().toEqualTypeOf<string[]|null>();expectTypeOf<Country['capital']>().toEqualTypeOf<CountryCapital|null|undefined>();expectTypeOf<NonNullable<Country['deep']>['tax']>().toEqualTypeOf<CountryTax|null|undefined>();
});
it('preserves actual Antarctica nulls and known zero population',async()=>{
 let calls=0;const client=parseAPI('fixture',{fetch:async()=>{calls++;return new Response(JSON.stringify(aq));}});const c=await client.country('AQ',{deep:true});expect(c).toEqual(aq);expect(c.languages).toBeNull();expect([c.currency,c.currency_name,c.currency_symbol]).toEqual([null,null,null]);expect(c.deep?.population).toBe(0);expect(calls).toBe(1);
});
it('preserves the actual Germany tax reference and explicit nested zeroes',async()=>{
 const zero={...de,capital:{name:null,lat:0,lon:0},deep:{...de.deep,tax:{name:null,rate:0}}};let calls=0;const bodies=[de,zero];const client=parseAPI('fixture',{fetch:async()=>{calls++;return new Response(JSON.stringify(bodies.shift()));}});
 const c=await client.country('DE',{deep:true});expect(c).toEqual(de);expect(c.deep?.tax).toEqual({name:'VAT',rate:19});expect(await client.country('DE',{deep:true})).toEqual(zero);expect(calls).toBe(2);
});
it('preserves absent and locked Deep and compact Country flags without widening the records',async()=>{
 const {deep:_,...core}=full,locked={...core,deep:{}},compact=fixture('country-compact.json');let calls=0;const bodies=[core,locked,compact];const client=parseAPI('fixture',{fetch:async()=>{calls++;return new Response(JSON.stringify(bodies.shift()));}});
 expect(await client.country('US')).toEqual(core);expect(await client.country('US',{deep:true})).toEqual(locked);expect(await client.continent.countries('NA')).toEqual(compact);expect(calls).toBe(3);
});
