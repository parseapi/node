import { readFileSync } from 'node:fs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Currency, type CurrencyRate, type CurrencyRateOptions, type CurrencyRatesOptions, type CurrencyReferenceRate } from '../src/index.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/currency-reference.json', import.meta.url), 'utf8'));
function client(body: unknown, headers: Record<string, string> = {}) {
	const calls: { url: URL; init?: RequestInit }[] = [];
	const fetch = vi.fn(async (input, init) => {
		calls.push({ url: new URL(String(input)), init });
		return new Response(typeof body === 'string' ? body : JSON.stringify(body), { headers });
	});
	return { parse: parseAPI('test', { fetch, retries: 0 }), calls, fetch };
}

describe('Currency reference clients', () => {
	it('preserves old callable references, compact responses and request headers', async () => {
		const compact = { base: 'USD', quote: 'EUR', rate: 0.9, date: '2026-10-09', amount: 0, converted: 0 };
		const { parse, calls } = client(compact);
		const lookup: (code: string) => Promise<Currency> = parse.currency;
		const rate: (base: string, quote: string, options?: CurrencyRateOptions) => Promise<CurrencyRate> = parse.currency.rate;
		expect(await rate('USD', 'EUR', { amount: 0, date: '2026-10-09' })).toEqual(compact);
		await lookup('SLE');
		expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ date: '2026-10-09', amount: '0' });
		expect(calls[1]!.url.pathname).toBe('/currency/SLE');
		for (const { init } of calls) {
			expect(new Headers(init?.headers).get('X-API-Key')).toBe('test');
			expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
			expect(init?.redirect).toBe('manual');
			expect(init?.method).toBeUndefined();
		}
		expectTypeOf<CurrencyRate['converted']>().toEqualTypeOf<number | undefined>();
	});



	it('maps keyed batch and both history routes without changing held days or gaps', async () => {
		const batch = client(fixture.batch);
		const quotes = Object.freeze(['EUR', 'JPY', 'KPW']);
		const options = Object.freeze({ source: 'ecb' as const, amount: 0 });
		expect(await batch.parse.currency.rates('USD', quotes, { ...options, date: '2026-10-09' })).toEqual(fixture.batch);
		expect(Object.fromEntries(batch.calls[0]!.url.searchParams)).toEqual({ quotes: 'EUR,JPY,KPW', date: '2026-10-09', amount: '0', });
		const pair = client(fixture.history);
		expect(await pair.parse.currency.history('USD', 'EUR', '2026-10-09', '2026-10-10', options)).toEqual(fixture.history);
		expect(pair.calls[0]!.url.pathname).toBe('/currency/USD/EUR/history');
		const multi = client(fixture.rates_history);
		const result = await multi.parse.currency.ratesHistory('USD', quotes, '2026-10-09', '2026-10-10', options);
		expect(result).toEqual(fixture.rates_history);
		expect(result.missing?.map(row => row.quote)).toEqual(['KPW', 'KPW']);
		expect(result.data[2]?.requested_date).toBe('2026-10-10');
		expect(result.data[2]?.date).toBe('2026-10-09');
		expect(multi.calls[0]!.url.pathname).toBe('/currency/USD/rates/history');
		expect(Object.fromEntries(multi.calls[0]!.url.searchParams)).toEqual({ quotes: 'EUR,JPY,KPW', from: '2026-10-09', to: '2026-10-10', amount: '0', });
	});




	it('rejects invalid quote lists before dispatch, and honors cancellation', async () => {
		const { parse, fetch } = client({});
		for (const quotes of [[], ['USD', 'usd'], ['US'], ['USD/JPY'], Array.from({ length: 51 }, () => 'EUR')]) expect(() => parse.currency.rates('USD', quotes)).toThrow(TypeError);
		const signal = AbortSignal.abort(new Error('cancelled'));
		await expect(parse.currency.ratesHistory('USD', ['JPY'], '2026-10-09', '2026-10-10', { signal })).rejects.toThrow('cancelled');
		expect(fetch).not.toHaveBeenCalled();
	});

});


const catalogFixture = JSON.parse(readFileSync(new URL('./fixtures/currency-catalog.json', import.meta.url), 'utf8'));
describe('Currency catalog and complete rates', () => {
    it('omits the quote query for the complete available vector and keeps explicit-empty invalid', async () => {
        const { parse, calls } = client(fixture.batch);
        const result = await parse.currency.rates('USD', undefined, {});
        expect(result.rates.EUR?.rate).toBe(fixture.batch.rates.EUR.rate);
        expect(result.rates.EUR).not.toHaveProperty('quote');
        for (const field of ['object', 'data', 'has_more', 'url']) expect(result).not.toHaveProperty(field);
        expectTypeOf(result.rates).toEqualTypeOf<Record<string, import('../src/index.js').CurrencyQuote>>();
        expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({});
        expect(() => parse.currency.rates('USD', [])).toThrow(TypeError);
    });
    it('maps catalog filters, nullable digits and explicit troy-ounce units', async () => {
        const { parse, calls } = client(catalogFixture.currencies);
        const result = await parse.currency.list({ q: 'gold', country: 'UA', deep: true, pretty: true, lang: 'fr' });
        expect(result.data).toEqual([]);
        const metal = await client(fixture.currencies).parse.currency.list({ q: 'gold', deep: true });
        expect(metal.data[0]!.digits).toBeNull(); expect(metal.data[0]!.unit).toBe('troy_ounce');
        expectTypeOf<import('../src/index.js').CurrencyResource['unit']>().toEqualTypeOf<'troy_ounce' | 'indexed_unit' | undefined>();
        expect(calls[0]!.url.pathname).toBe('/currency');
        expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ q: 'gold', country: 'UA', deep: 'true', pretty: 'true', lang: 'fr' });
    });

});


describe('Currency indexed-unit response', () => {

    it('retains indexed-unit qualification and nullable conversion', async () => {
        const { parse } = client(fixture.indexed_pair);
        const result = await parse.currency.rate('USD', 'MXV', { amount: 1 });
        expect(result.units?.quote).toBe('indexed_unit');
        expect(result.converted).toBe(fixture.indexed_pair.converted);
    });
});


it('types new metal pairs as nullable while retaining the old generic pair function', async () => {
    const metal = { base: 'USD', quote: 'XAU', ...fixture.all_rates.rates.XAU, amount: 1, converted: null };
    const { parse } = client(metal);
    expectTypeOf(parse.currency.rate('USD', 'XAU', { amount: 1 })).toEqualTypeOf<Promise<CurrencyReferenceRate>>();
    expectTypeOf(parse.currency.rate('USD', 'xau')).toEqualTypeOf<Promise<CurrencyReferenceRate>>();
    const old: (base: string, quote: string, options?: CurrencyRateOptions) => Promise<CurrencyRate> = parse.currency.rate;
    expectTypeOf(old('USD', 'EUR')).toEqualTypeOf<Promise<CurrencyRate>>();
    expect((await parse.currency.rate('USD', 'XAU', { amount: 1 })).converted).toBeNull();
});

const reportingFixture = JSON.parse(readFileSync(new URL('./fixtures/currency-summary.json', import.meta.url), 'utf8'));
describe('Currency archive sampling and publication summaries', () => {
    it('retains complete original ECB samples and forwards interval on both history routes', async () => {
        const { parse, calls } = client(reportingFixture.sampled_history);
        const result = await parse.currency.history('USD', 'JPY', '1999-01-01', '2026-10-09', { interval: 'month', });
        expect(result).toEqual(reportingFixture.sampled_history);
        expect(result.interval).toBe('month'); expect(result.missing).toEqual(['1999-01-01']);
        expect(result.data.at(-1)?.requested_date).toBe('2026-10-09');
        await parse.currency.ratesHistory('USD', ['JPY'], '1999-01-01', '2026-10-09', { interval: 'week', });
        expect(calls[0]!.url.searchParams.get('interval')).toBe('month');
        expect(calls[1]!.url.searchParams.get('interval')).toBe('week');
        expect(calls[1]!.url.pathname).toBe('/currency/USD/rates/history');
    });
    it('decodes the complete January report and sends only the report controls', async () => {
        const { parse, calls } = client(reportingFixture.summary);
        const result = await parse.currency.ratesSummary('USD', ['EUR'], '1999-01-01', '1999-01-31', { interval: 'month', });
        expect(result).toEqual(reportingFixture.summary);
        expect(result.data[0]!.observation_count).toBe(20); expect(result.data[0]!.missing_day_count).toBe(3);
        expect(result.data[0]!.average).toBe(0.861559614071263);
        expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ quotes: 'EUR', from: '1999-01-01', to: '1999-01-31', interval: 'month', });
        expect(calls[0]!.url.pathname).toBe('/currency/USD/rates/summary');
    });
});
