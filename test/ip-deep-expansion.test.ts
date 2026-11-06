import {expect,expectTypeOf,it} from 'vitest';
import {parseAPI,type IpDeep} from '../src/index.js';
it('reads the additive IP Deep facts without dropping zero, false, leading zeros or null',async()=>{
 const body={"ip":"198.51.100.10","country":"XX","country_name":"Example","continent":"NA","asn":"AS64512","asn_name":"Fixture",...{"city":"Example","state":"EX","state_name":"Example state","postal":"00123","latitude":0,"longitude":-1e-06,"timezone":"Etc/UTC","network":"198.51.100.0/24","asn_type":"education","registry":"arin","datacenter":false,"relay":false,"tor":false,"vpn":false,"proxy":false,"provider":null}};const client=parseAPI('fixture',{fetch:async()=>Response.json(body)});
 const result=await client.ip(body.ip,{deep:true});expect(result).toEqual(body);expect(result?.latitude).toBe(0);expect(result?.postal).toBe('00123');expect(result?.proxy).toBe(false);
 expectTypeOf<IpDeep['latitude']>().toEqualTypeOf<number|null|undefined>();expectTypeOf<IpDeep['proxy']>().toEqualTypeOf<boolean|null|undefined>();
});
it('continues to read absent, locked and explicit unknown Deep facts',async()=>{for(const deep of [undefined,{}, {latitude:null,longitude:null,proxy:null}]){const client=parseAPI('fixture',{fetch:async()=>Response.json({ip:'198.51.100.10',...deep})});expect(await client.ip('198.51.100.10',{deep:true})).toEqual({ip:'198.51.100.10',...deep});}});
