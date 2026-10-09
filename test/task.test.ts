import { expect, it, vi } from 'vitest';
import { parseAPI } from '../src/index.js';

it('lost task response retries the same POST body and idempotency key with the pinned contract',async()=>{
	const calls: {url:URL;init:RequestInit}[]=[];
	const fetch=vi.fn(async(url:string|URL|Request,init?:RequestInit)=>{
		calls.push({url:new URL(String(url)),init:init!});
		if(calls.length===1) throw Error('connection lost after server completion');
		return new Response(JSON.stringify({status_code:200,result:{valid:null},receipt:{additional_cost_usd:'0.0000'}}));
	});
	const client=parseAPI('fixture',{baseUrl:'https://fixture.invalid',fetch});
	const input={operation:'email' as const,value:'private@example.test',deep:true};
	const result=await client.task.lookup(`task_${'a'.repeat(40)}`,input,'same-request');
	expect(result.result).toEqual({valid:null});expect(calls).toHaveLength(2);
	for(const {url,init} of calls){expect(url.pathname).toBe(`/task/task_${'a'.repeat(40)}/lookup`);expect(url.search).toBe('');expect(init.method).toBe('POST');expect(JSON.parse(init.body as string)).toEqual(input);const headers=new Headers(init.headers);expect(headers.get('Idempotency-Key')).toBe('same-request');expect(headers.get('Parse-Version')).toBe('2.0.0');}
});

it('creation, status and cancellation use the same transport and secret header',async()=>{
	const fetch=vi.fn(async()=>new Response('{}'));
	const client=parseAPI('fixture',{fetch});
	const task={operations:[{operation:'carrier' as const,count:2}],budget_usd:'1.00'};
	await client.task(task,'create');await client.task.get('task_id');await client.task.cancel('task_id');
	expect(fetch.mock.calls).toHaveLength(3);
});
