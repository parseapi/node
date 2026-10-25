import { afterEach, describe, expect, it, vi } from 'vitest';
import { BulkAPIError, ParseAPIError, createBulkClient, parseAPI } from '../src/index.js';

const id = 'job_23456789abcdef';
const job = { job: { id, status: 'quoted', sample: { unknown: null, known_zero: 0, empty: [], future: false } }, poll_after_seconds: null, quote: { id: 'quote_fixture', currency: 'USD', cost_cents: 0, expires_at: '2026-10-23T20:00:00Z' } };
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', ...headers } });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Bulk metadata client', () => {
	it('uses the ordinary SDK error class for Bulk failures and its compatibility alias', async () => {
		expect(BulkAPIError).toBe(ParseAPIError);
		const error = new ParseAPIError(401, 'invalid_api_key', 'Invalid key');
		expect(error).toMatchObject({ name: 'ParseAPIError', docs: null, requestId: null, retryAfter: null });
		const stub = vi.fn(async () => json({ code: 'invalid_api_key', message: 'Invalid key' }, 401)) as typeof fetch;
		await expect(createBulkClient('key', { fetch: stub }).status(id)).rejects.toBeInstanceOf(ParseAPIError);
		await expect(createBulkClient('key', { fetch: stub }).status(id)).rejects.toMatchObject({ name: 'ParseAPIError', status: 401, code: 'invalid_api_key' });
		await expect(parseAPI('key', { fetch: stub, retries: 0 }).ip('8.8.8.8')).rejects.toBeInstanceOf(BulkAPIError);
	});

	it('uses the website origin without changing ordinary lookup traffic or sending file bytes', async () => {
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		const fetchStub = vi.fn(async (url, init) => {
			calls.push({ url: String(url), init });
			return json(calls.length === 1 ? { id, rail: 'plan', upload_url: 'https://files.example.test/private?signature=opaque', upload_headers: { 'content-type': 'text/csv' }, upload_method: 'PUT', upload_expires_at: '2026-10-23T20:00:00Z' } : String(url).endsWith('/result') ? { id, download_url: 'https://parseapi.com/api/agent/bulk/download?cap=opaque', expires_at: '2026-10-23T20:00:00Z' } : job);
		}) as typeof fetch;
		const bulk = createBulkClient('private_fixture_key', { fetch: fetchStub, webUrl: 'http://127.0.0.1:3456' });
		const upload = await bulk.upload({ filename: 'customers.csv', file_size: 101, country: 'US', lang: 'fr' });
		expect(upload.id).toBe(id);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.url).toBe('http://127.0.0.1:3456/api/agent/bulk');
		expect(JSON.parse(String(calls[0]!.init!.body))).toEqual({ filename: 'customers.csv', file_size: 101, country: 'US', lang: 'fr' });
		expect(calls[0]!.init!.redirect).toBe('manual');
		expect(calls[0]!.init!.credentials).toBe('omit');
		expect(new Headers(calls[0]!.init!.headers).get('x-api-key')).toBe('private_fixture_key');
		await bulk.preview(id, { checks: ['ip', 'email'] });
		await bulk.start(id, { quote_id: 'quote_fixture', max_cost_cents: 0 });
		expect(await bulk.status(id)).toEqual(job);
		await bulk.result(id);
		expect(calls.map(call => call.url)).toEqual([
			'http://127.0.0.1:3456/api/agent/bulk', `http://127.0.0.1:3456/api/agent/bulk/${id}/preview`, `http://127.0.0.1:3456/api/agent/bulk/${id}/start`, `http://127.0.0.1:3456/api/agent/bulk/${id}`, `http://127.0.0.1:3456/api/agent/bulk/${id}/result`,
		]);
		expect(JSON.parse(String(calls[1]!.init!.body))).toEqual({ checks: ['ip', 'email'] });
		expect(JSON.parse(String(calls[2]!.init!.body))).toEqual({ quote_id: 'quote_fixture', max_cost_cents: 0 });
		expect(calls[3]!.init!.method).toBe('GET');
		const parse = parseAPI('private_fixture_key', { fetch: fetchStub, baseUrl: 'https://api.example.test', retries: 0 });
		await parse.ip('8.8.8.8');
		expect(calls.at(-1)!.url).toBe('https://api.example.test/ip/8.8.8.8');
	});

	it('keeps web and API environment overrides independent', async () => {
		vi.stubEnv('PARSEAPI_KEY', 'environment_key');
		vi.stubEnv('PARSEAPI_WEB_URL', 'http://localhost:1234');
		vi.stubEnv('PARSEAPI_BASE_URL', 'https://api.example.test');
		const stub = vi.fn(async () => json(job)) as typeof fetch;
		await createBulkClient(undefined, { fetch: stub }).status(id);
		expect(String(vi.mocked(stub).mock.calls[0]![0])).toBe(`http://localhost:1234/api/agent/bulk/${id}`);
		expect(new Headers(vi.mocked(stub).mock.calls[0]![1]!.headers).get('x-api-key')).toBe('environment_key');
	});

	it('preserves pending quotes and paid browser handoffs without sending a payment', async () => {
		const stub = vi.fn(async () => json({ ...job, quote: null, poll_after_seconds: 2 })) as typeof fetch;
		const bulk = createBulkClient('key', { fetch: stub });
		expect((await bulk.preview(id)).quote).toBeNull();
		const handoff = { job: job.job, requires_payment: true, code: 'payment_required', confirmation_url: `https://parseapi.com/bulk/${id}` };
		vi.mocked(stub).mockResolvedValue(json(handoff));
		expect(await bulk.start(id, { quote_id: 'quote_fixture', max_cost_cents: 500 })).toEqual(handoff);
		expect(stub).toHaveBeenCalledTimes(2);
	});

	it('rejects unsafe origins and URL components before dispatch', () => {
		for (const webUrl of ['http://example.com', 'ftp://parseapi.com', 'https://user:pass@parseapi.com', 'https://parseapi.com/path', 'https://parseapi.com?redirect=evil', 'https://parseapi.com/#fragment', '//parseapi.com', 'http://127.0.0.1.evil.test']) {
			expect(() => createBulkClient('key', { webUrl })).toThrow(TypeError);
		}
		for (const webUrl of ['https://parseapi.com', 'http://127.0.0.1:3000', 'http://[::1]:3000']) expect(() => createBulkClient('key', { webUrl })).not.toThrow();
	});

	it('never follows redirects or forwards its key to returned storage locations', async () => {
		const stub = vi.fn(async () => json({}, 307, { location: 'https://evil.example/steal' })) as typeof fetch;
		const bulk = createBulkClient('private_fixture_key', { fetch: stub });
		await expect(bulk.upload({ filename: 'customers.csv', file_size: 10 })).rejects.toMatchObject({ code: 'unexpected_redirect', status: 307 });
		expect(stub).toHaveBeenCalledTimes(1);
		expect(String(vi.mocked(stub).mock.calls[0]![0])).toBe('https://parseapi.com/api/agent/bulk');
	});

	it('does not retry a create or paid start after server or network uncertainty', async () => {
		const stub = vi.fn(async () => json({ code: 'service_unavailable', message: 'Try later', request_id: 'req_fixture' }, 503, { 'retry-after': '7' })) as typeof fetch;
		const bulk = createBulkClient('key', { fetch: stub });
		await expect(bulk.upload({ filename: 'customers.csv', file_size: 10 })).rejects.toMatchObject({ code: 'service_unavailable', requestId: 'req_fixture', retryAfter: '7' });
		await expect(bulk.start(id, { quote_id: 'quote_fixture', max_cost_cents: 500 })).rejects.toBeInstanceOf(BulkAPIError);
		expect(stub).toHaveBeenCalledTimes(2);
		vi.mocked(stub).mockRejectedValue(new Error('lost connection'));
		await expect(bulk.upload({ filename: 'customers.csv', file_size: 10 })).rejects.toThrow('lost connection');
		expect(stub).toHaveBeenCalledTimes(3);
	});

	it('rejects invalid identifiers, bounds, and retired checks locally', async () => {
		const stub = vi.fn(async () => json(job)) as typeof fetch;
		const bulk = createBulkClient('key', { fetch: stub });
		for (const target of ['https://evil.test', '../jobs', `${id}/../../secrets`, 'job_wrong']) expect(() => bulk.status(target)).toThrow(TypeError);
		for (const file_size of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) await expect(bulk.upload({ filename: 'x.csv', file_size })).rejects.toThrow(TypeError);
		for (const checks of [[], ['npi'], ['bank'], ['vat'], ['litigator'], ['email', 'email']]) await expect(bulk.preview(id, { checks })).rejects.toThrow(TypeError);
		for (const max_cost_cents of [-1, 1.5, Infinity]) expect(() => bulk.start(id, { quote_id: 'quote', max_cost_cents })).toThrow(TypeError);
		expect(stub).not.toHaveBeenCalled();
	});

	it('bounds streamed response size and rejects malformed successful JSON', async () => {
		const stub = vi.fn(async () => json({ ...job, sample: 'x'.repeat(256 * 1024) })) as typeof fetch;
		const bulk = createBulkClient('key', { fetch: stub });
		await expect(bulk.status(id)).rejects.toMatchObject({ code: 'invalid_api_response' });
		vi.mocked(stub).mockResolvedValue(new Response('not JSON'));
		await expect(bulk.status(id)).rejects.toMatchObject({ code: 'invalid_api_response' });
		vi.mocked(stub).mockResolvedValue(json([]));
		await expect(bulk.status(id)).rejects.toMatchObject({ code: 'invalid_api_response' });
		expect(stub).toHaveBeenCalledTimes(3);
	});

	it('cancels the same request without another attempt', async () => {
		const controller = new AbortController();
		let started!: () => void;
		const pending = new Promise<void>(resolve => { started = resolve; });
		const stub = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
			init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
			started();
		})) as typeof fetch;
		const response = createBulkClient('key', { fetch: stub }).status(id, { signal: controller.signal });
		await pending;
		controller.abort(new Error('user stopped'));
		await expect(response).rejects.toThrow('user stopped');
		expect(stub).toHaveBeenCalledTimes(1);
	});
});
