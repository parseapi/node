import { describe, expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';

describe('SDK API contract', () => {
	it('pins the supported contract on retries, self lookups and custom user agents', async () => {
		const calls: { url: string; init: RequestInit }[] = [];
		const parse = parseAPI('same-production-key', {
			fetch: async (input, init = {}) => {
				calls.push({ url: String(input), init });
				return calls.length === 1
					? new Response('{"code":"unavailable"}', { status: 503, headers: { 'Retry-After': '0' } })
					: new Response('{}');
			},
		});
		await parse.country('US');
		await parse.ip.self();
		await parse.useragent('Custom browser');
		expect(calls.map(({ url }) => new URL(url).pathname)).toEqual(['/country/US', '/country/US', '/ip', '/useragent']);
		for (const { url, init } of calls) {
			const headers = new Headers(init.headers);
			expect(headers.get('Parse-Version')).toBe('2.0.0');
			expect(headers.get('X-API-Key')).toBe('same-production-key');
			expect(new URL(url).search).toBe('');
			expect(init.redirect).toBe('manual');
		}
		expect(new Headers(calls[3]!.init.headers).get('User-Agent')).toBe('Custom browser');
	});
});
