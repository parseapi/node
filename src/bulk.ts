import { ParseAPIError as BulkAPIError } from './errors.js';
export { BulkAPIError };

/** Account-owned file workflows. File bytes travel directly to the returned upload URL. */
export interface BulkClientOptions {
	/** ParseAPI website origin. Separate from the lookup client's baseUrl. */
	webUrl?: string;
	/** Request timeout in milliseconds. Defaults to 10000. */
	timeoutMs?: number;
	/** Custom fetch implementation for this client. */
	fetch?: typeof fetch;
}

export interface BulkRequestOptions { signal?: AbortSignal }
export interface BulkUploadInput { filename: string; file_size: number; country?: string; lang?: string }
export interface BulkPreviewInput { checks?: string[] }
export interface BulkStartInput { quote_id: string; max_cost_cents: number }

/** Public checks supported by the current file workflow. */
export const BULK_CHECKS = ['email', 'phone', 'carrier', 'caller', 'hlr', 'ip', 'domain', 'useragent', 'country', 'postal', 'address', 'name', 'date'] as const;

export interface BulkUpload {
	id: string;
	rail: string;
	upload_url: string;
	upload_headers: Record<string, string>;
	upload_method: 'PUT';
	upload_expires_at: string;
	[key: string]: unknown;
}

/** Status and previews retain server fields, including unknown and nullable results. */
export interface BulkJob {
	id: string;
	status: string;
	[key: string]: unknown;
}

export interface BulkStatus {
	job: BulkJob;
	poll_after_seconds?: number | null;
	[key: string]: unknown;
}

export interface BulkQuote {
	id: string;
	currency: 'USD';
	cost_cents: number;
	expires_at: string | null;
	[key: string]: unknown;
}

export interface BulkPreview extends BulkStatus {
	quote: BulkQuote | null;
}

/** A short-lived download capability. Fetch this URL without an API key header. */
export interface BulkResult {
	id: string;
	download_url: string;
	expires_at: string;
	[key: string]: unknown;
}

export interface BulkClient {
	upload(input: BulkUploadInput, options?: BulkRequestOptions): Promise<BulkUpload>;
	preview(id: string, input?: BulkPreviewInput, options?: BulkRequestOptions): Promise<BulkPreview>;
	start(id: string, input: BulkStartInput, options?: BulkRequestOptions): Promise<BulkStatus>;
	status(id: string, options?: BulkRequestOptions): Promise<BulkStatus>;
	result(id: string, options?: BulkRequestOptions): Promise<BulkResult>;
}

const MAX_RESPONSE_BYTES = 256 * 1024;
const jobId = /^job_[23456789abcdefghjkmnpqrstuvwxyz]{14}$/;
const invalidResponse = () => new BulkAPIError(502, 'invalid_api_response', 'The Bulk service returned an invalid response.');

function origin(value: string): string {
	let url: URL;
	try { url = new URL(value); } catch { throw new TypeError('ParseAPI Bulk webUrl must be an HTTPS origin.'); }
	const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
	if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
		throw new TypeError('ParseAPI Bulk webUrl must be an HTTPS origin, or HTTP on loopback.');
	}
	return url.origin;
}

async function boundedJson(response: Response): Promise<Record<string, unknown>> {
	const length = response.headers.get('content-length');
	if (length && /^\d+$/.test(length) && Number(length) > MAX_RESPONSE_BYTES) {
		await response.body?.cancel().catch(() => {});
		throw invalidResponse();
	}
	if (!response.body) throw invalidResponse();
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let size = 0, text = '';
	try {
		while (true) {
			const part = await reader.read();
			if (part.done) break;
			size += part.value.byteLength;
			if (size > MAX_RESPONSE_BYTES) {
				await reader.cancel().catch(() => {});
				throw invalidResponse();
			}
			text += decoder.decode(part.value, { stream: true });
		}
		text += decoder.decode();
	} finally { reader.releaseLock(); }
	try {
		const data: unknown = JSON.parse(text);
		if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
	} catch { /* A successful file workflow always returns a JSON object. */ }
	throw invalidResponse();
}

function object(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Create a Bulk client. Requests are never retried automatically, including upload creation. */
export function createBulkClient(apiKey?: string, options: BulkClientOptions = {}): BulkClient {
	const key = apiKey || (typeof process !== 'undefined' ? process.env.PARSEAPI_KEY : undefined);
	if (!key) throw new Error('createBulkClient: missing API key. Pass one or set PARSEAPI_KEY.');
	const webUrl = origin(options.webUrl ?? (typeof process !== 'undefined' ? process.env.PARSEAPI_WEB_URL : undefined) ?? 'https://parseapi.com');
	const timeout = options.timeoutMs ?? 10000;
	if (!Number.isSafeInteger(timeout) || timeout <= 0) throw new TypeError('ParseAPI Bulk timeoutMs must be a positive integer.');
	const doFetch = options.fetch ?? fetch;
	function path(id: string): string {
		if (typeof id !== 'string' || !jobId.test(id)) throw new TypeError('ParseAPI Bulk requires a valid job ID.');
		return `/api/agent/bulk/${id}`;
	}
	async function request<T>(path: string, input: unknown, controls?: BulkRequestOptions): Promise<T> {
		const signal = controls?.signal;
		signal?.throwIfAborted();
		const controller = new AbortController();
		const onAbort = () => controller.abort(signal?.reason);
		signal?.addEventListener('abort', onAbort, { once: true });
		const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeout);
		try {
			const response = await doFetch(`${webUrl}${path}`, {
				method: input === undefined ? 'GET' : 'POST',
				redirect: 'manual', credentials: 'omit',
				headers: { 'X-API-Key': key!, 'Parse-Version': '2.0.0', 'Accept': 'application/json', ...(input === undefined ? {} : { 'Content-Type': 'application/json' }) },
				...(input === undefined ? {} : { body: JSON.stringify(input) }), signal: controller.signal,
			});
			signal?.throwIfAborted();
			if (response.status >= 300 && response.status < 400) {
				await response.body?.cancel().catch(() => {});
				throw new BulkAPIError(response.status, 'unexpected_redirect', 'The Bulk service returned an unexpected redirect.');
			}
			const data = await boundedJson(response);
			signal?.throwIfAborted();
			if (!response.ok) throw new BulkAPIError(response.status,
				typeof data.code === 'string' ? data.code : 'bulk_request_failed',
				typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : `Bulk request failed with status ${response.status}`,
				typeof data.docs === 'string' ? data.docs : null,
				typeof data.request_id === 'string' ? data.request_id : null, response.headers.get('retry-after'));
			return data as T;
		} finally {
			clearTimeout(timer);
			signal?.removeEventListener('abort', onAbort);
		}
	}
	async function workflow<T extends BulkStatus>(target: string, id: string, input: unknown, controls?: BulkRequestOptions): Promise<T> {
		const data = await request<T>(target, input, controls);
		if (!object(data.job) || data.job.id !== id || typeof data.job.status !== 'string') throw invalidResponse();
		return data;
	}
	return {
		upload: async (input, controls) => {
			if (!object(input) || typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 200 || !Number.isSafeInteger(input.file_size) || input.file_size <= 0) throw new TypeError('Provide a filename and positive file_size in bytes.');
			if (input.country !== undefined && (typeof input.country !== 'string' || !/^[A-Za-z]{2}$/.test(input.country))) throw new TypeError('Bulk country must be an ISO2 code.');
			if (input.lang !== undefined && (typeof input.lang !== 'string' || input.lang.length < 2 || input.lang.length > 64)) throw new TypeError('Provide a valid Bulk display language.');
			const data = await request<BulkUpload>('/api/agent/bulk', { filename: input.filename, file_size: input.file_size, ...(input.country === undefined ? {} : { country: input.country }), ...(input.lang === undefined ? {} : { lang: input.lang }) }, controls);
			if (typeof data.id !== 'string' || !jobId.test(data.id) || typeof data.upload_url !== 'string' || data.upload_method !== 'PUT' || typeof data.upload_expires_at !== 'string' || !object(data.upload_headers) || Object.values(data.upload_headers).some(value => typeof value !== 'string')) throw invalidResponse();
			return data;
		},
		preview: async (id, input = {}, controls) => {
			if (!object(input) || (input.checks !== undefined && (!Array.isArray(input.checks) || input.checks.length < 1 || input.checks.length > BULK_CHECKS.length || input.checks.some(check => !(BULK_CHECKS as readonly string[]).includes(check)) || new Set(input.checks).size !== input.checks.length))) throw new TypeError('Provide distinct public Bulk checks.');
			const data = await workflow<BulkPreview>(`${path(id)}/preview`, id, input.checks === undefined ? {} : { checks: input.checks }, controls);
			if (data.quote !== null && (!object(data.quote) || typeof data.quote.id !== 'string' || data.quote.currency !== 'USD' || !Number.isSafeInteger(data.quote.cost_cents) || data.quote.cost_cents < 0 || (data.quote.expires_at !== null && typeof data.quote.expires_at !== 'string'))) throw invalidResponse();
			return data;
		},
		start: (id, input, controls) => {
			if (!object(input) || typeof input.quote_id !== 'string' || !input.quote_id || input.quote_id.length > 512 || !Number.isSafeInteger(input.max_cost_cents) || input.max_cost_cents < 0) throw new TypeError('Provide the current quote_id and approved max_cost_cents.');
			return workflow<BulkStatus>(`${path(id)}/start`, id, { quote_id: input.quote_id, max_cost_cents: input.max_cost_cents }, controls);
		},
		status: (id, controls) => workflow<BulkStatus>(path(id), id, undefined, controls),
		result: async (id, controls) => {
			const data = await request<BulkResult>(`${path(id)}/result`, undefined, controls);
			if (data.id !== id || typeof data.download_url !== 'string' || typeof data.expires_at !== 'string') throw invalidResponse();
			return data;
		},
	};
}
