import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Dns, type DnsOptions } from '../src/index.js';

it('encodes DNS names and forwards the optional question type without changing records', async () => {
	const body = { domain: '_dmarc.xn--bcher-kva.example', records: [
		{ name: '_dmarc.xn--bcher-kva.example.', type: 'TXT', ttl: 0, value: '\"v=DMARC1; \" \"p=reject\"', future: true },
		{ name: 'alias.example.', type: 'CNAME', ttl: 300, value: 'target.example.' },
	], future: null };
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body)));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.dns('_dmarc.bücher.example.', { type: 'txt' })).resolves.toEqual(body);
	await parse.dns('example.com');
	expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
		'https://api.parseapi.com/dns/_dmarc.b%C3%BCcher.example.?type=txt',
		'https://api.parseapi.com/dns/example.com',
	]);
	expectTypeOf<Dns['records'][number]['type']>().toEqualTypeOf<string>();
	expectTypeOf<'deep'>().not.toMatchTypeOf<keyof DnsOptions>();
});

it('preserves empty records and distinguishes lookup failures', async () => {
	const fetch = vi.fn()
		.mockResolvedValueOnce(new Response('{"domain":"example.com","records":[]}'))
		.mockResolvedValueOnce(new Response('{"code":"dns_unavailable","message":"DNS lookup failed","request_id":"req_dns"}', { status: 503 }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.dns('example.com')).resolves.toMatchObject({ records: [] });
	await expect(parse.dns('example.com', { retries: 0 })).rejects.toMatchObject({ status: 503, code: 'dns_unavailable' });
	expect(fetch).toHaveBeenCalledTimes(2);
});
