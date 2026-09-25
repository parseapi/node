import { afterEach, expect, it, vi } from 'vitest';
import { parseAPI, ParseAPIError } from '../src/index.js';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
const payload = { code: 'rate_limited', message: 'Wait for reset', docs: 'https://parseapi.com/docs', request_id: 'req_fixture' };
const failed = (retryAfter?: string) => new Response(JSON.stringify(payload), { status: 429, headers: retryAfter === undefined ? {} : { 'Retry-After': retryAfter } });

it.each(['60', '9'.repeat(400), 'Sat, 05 Sep 2026 00:01:00 GMT'])('declines a long server wait immediately and retains its HTTP error: %s', async (retryAfter) => {
	vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-05T00:00:00Z'));
	const fetch = vi.fn(async () => failed(retryAfter));
	const parse = parseAPI('fixture', { fetch });
	await expect(parse.card('001234')).rejects.toMatchObject({ status: 429, code: payload.code, message: payload.message, docs: payload.docs, requestId: payload.request_id, retryAfter });
	expect(fetch).toHaveBeenCalledTimes(1);
	expect(vi.getTimerCount()).toBe(0);
});

it.each([['0', 0], ['2', 2000], ['Sat, 05 Sep 2026 00:00:02 GMT', 2000]] as const)('honors a short wait without retrying early: %s', async (retryAfter, delay) => {
	vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-05T00:00:00Z'));
	const fetch = vi.fn().mockResolvedValueOnce(failed(retryAfter)).mockResolvedValueOnce(new Response('{}'));
	const parse = parseAPI('fixture', { fetch });
	const result = parse.card('001234');
	if (delay > 0) { await vi.advanceTimersByTimeAsync(delay-1); expect(fetch).toHaveBeenCalledTimes(1); }
	await vi.advanceTimersByTimeAsync(delay ? 1 : 0);
	await expect(result).resolves.toEqual({});
	expect(fetch).toHaveBeenCalledTimes(2);
});

it.each([undefined, 'nonsense', '-1', 'NaN', 'Infinity', '1e999'])('uses ordinary backoff for missing or malformed headers: %s', async (retryAfter) => {
	vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.4);
	const fetch = vi.fn().mockResolvedValueOnce(failed(retryAfter)).mockResolvedValueOnce(new Response('{}'));
	const parse = parseAPI('fixture', { fetch });
	const result = parse.card('001234');
	await vi.advanceTimersByTimeAsync(99); expect(fetch).toHaveBeenCalledTimes(1);
	await vi.advanceTimersByTimeAsync(1); await expect(result).resolves.toEqual({});
	expect(fetch).toHaveBeenCalledTimes(2);
});

it('retains Retry-After when retries are disabled or exhausted and keeps old constructors', async () => {
	const original = new ParseAPIError(400, 'invalid_request', 'Input', null, null);
	expect(original.retryAfter).toBeNull();
	for (const [retries, retryAfter] of [[0, '2'], [1, '0']] as const) {
		const fetch = vi.fn(async () => failed(retryAfter));
		await expect(parseAPI('fixture', { fetch, retries }).card('001234')).rejects.toMatchObject({ retryAfter, code: 'rate_limited' });
		expect(fetch).toHaveBeenCalledTimes(retries+1);
	}
	await expect(parseAPI('fixture', { fetch: async () => failed(), retries: 0 }).card('001234')).rejects.toMatchObject({ retryAfter: null });
});

it('caps the backoff window while retaining full jitter for larger retry counts', async () => {
	vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.4);
	const fetch = vi.fn(async () => failed('malformed'));
	const result = expect(parseAPI('fixture', { fetch, retries: 8 }).card('001234')).rejects.toMatchObject({ retryAfter: 'malformed' });
	await vi.advanceTimersByTimeAsync(9099);
	expect(fetch).toHaveBeenCalledTimes(8);
	await vi.advanceTimersByTimeAsync(1);
	await result;
	expect(fetch).toHaveBeenCalledTimes(9);
});
