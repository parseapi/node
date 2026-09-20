import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAPI, ParseAPIError, type PreflightTask } from '../src/index.js';

const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
	status, headers: { 'content-type': 'application/json', 'retry-after': '0' },
});
afterEach(() => vi.restoreAllMocks());

describe('preflight', () => {
	it('posts counts and an advisory budget through the same authenticated transport', async () => {
		const result = { estimate_only: true, permitted: true, cost: { maximum_usd: null, projected_maximum_usd: '0.00' }, future: false };
		const fetch = vi.fn(async () => response(result));
		const client = parseAPI('test-secret', { baseUrl: 'https://fixture.invalid/', fetch });
		const task: PreflightTask = { operations: [{ operation: 'email', count: 100, deep: true }, { operation: 'country', count: 1 }], budget_usd: '2.50' };
		expect(await client.preflight(task)).toEqual(result);
		const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
		expect(url.href).toBe('https://fixture.invalid/preflight');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body as string)).toEqual(task);
		expect(init.redirect).toBe('manual');
		expect(new Headers(init.headers).get('X-API-Key')).toBe('test-secret');
		expect(new Headers(init.headers).get('Parse-Version')).toBe('2.0.0');
		expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
		expect(init.signal).toBeInstanceOf(AbortSignal);
		await client.country('US');
		const [, lookup] = fetch.mock.calls[1] as unknown as [URL, RequestInit];
		expect(lookup.method).toBeUndefined();
		expect(lookup.body).toBeUndefined();
		expect(new Headers(lookup.headers).has('Content-Type')).toBe(false);
	});

	it('retries read-only preflight with the original serialized task and pinned headers', async () => {
		const task: PreflightTask = { operations: [{ operation: 'email', count: 10, deep: true }], budget_usd: '1.00' };
		const calls: RequestInit[] = [];
		const client = parseAPI('test-secret', { fetch: async (_url, init) => {
			calls.push(init!);
			task.operations[0]!.count = 500;
			return calls.length < 3 ? response({ code: 'service_unavailable' }, 503) : response({ estimate_only: true });
		} });
		await client.preflight(task);
		expect(calls).toHaveLength(3);
		for (const init of calls) {
			expect(JSON.parse(init.body as string).operations[0].count).toBe(10);
			expect(new Headers(init.headers).get('Parse-Version')).toBe('2.0.0');
			expect(new Headers(init.headers).get('X-API-Key')).toBe('test-secret');
		}
	});

	it('preserves API errors and per-request retry controls', async () => {
		const fetch = vi.fn(async () => response({ code: 'service_unavailable', message: 'Unavailable', docs: null, request_id: 'req_preflight' }, 503));
		const client = parseAPI('test-secret', { fetch });
		await expect(client.preflight({ operations: [{ operation: 'dns', count: 1 }] }, { retries: 0 })).rejects.toMatchObject({
			name: 'ParseAPIError', status: 503, code: 'service_unavailable', requestId: 'req_preflight',
		});
		expect(fetch).toHaveBeenCalledTimes(1);
		const denied = parseAPI('test-secret', { fetch: async () => response({ code: 'permission_denied', message: 'Secret key required' }, 403) });
		await expect(denied.preflight({ operations: [{ operation: 'country', count: 1 }] })).rejects.toBeInstanceOf(ParseAPIError);
	});

	it('cancels an in-flight POST without retrying', async () => {
		const abort = new AbortController();
		const reason = new Error('cancelled');
		const fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
			init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
			queueMicrotask(() => abort.abort(reason));
		}));
		const client = parseAPI('test-secret', { fetch });
		await expect(client.preflight({ operations: [{ operation: 'country', count: 1 }] }, { signal: abort.signal })).rejects.toBe(reason);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
