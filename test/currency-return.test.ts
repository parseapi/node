import { describe, expect, it } from 'vitest';
import { parseAPI, type Currency, type CurrencyRate } from '../src/index.js';

describe('restored published Currency client contract', () => {
  it('keeps Currency references in Core and preserves dated conversion with zero amounts', async () => {
    const calls: { url: URL; headers: Headers }[] = [];
    const parse = parseAPI('fixture', { retries: 0, fetch: async (input, init) => {
      const url = new URL(String(input)); calls.push({ url, headers: new Headers(init?.headers) });
      return Response.json(url.pathname === '/currency/USD' ? { currency: 'USD', iso_numeric: 840, name: 'US Dollar', name_plural: 'US Dollars', symbol: '$', symbol_native: '$', digits: 2, countries: ['US'], ...(url.searchParams.get('deep') === 'true' ? { deep: {} } : {}) } : { base: 'USD', quote: 'EUR', rate: 0.9, date: '2026-10-21', amount: 0, converted: 0 });
    } });
    const lookup: (code: string) => Promise<Currency> = parse.currency;
    const rate: (base: string, quote: string) => Promise<CurrencyRate> = parse.currency.rate;
    const core = await lookup('USD'); expect(core.currency).toBe('USD'); expect(core.iso_numeric).toBe(840); expect(core.countries).toEqual(['US']); expect(core.deep).toBeUndefined();
    await parse.currency('USD', { deep: true, lang: 'fr' });
    expect(await rate('USD', 'EUR')).toMatchObject({ base: 'USD', quote: 'EUR' });
    expect(await parse.currency.rate('USD', 'EUR', { date: '2026-10-21', amount: 0 })).toMatchObject({ amount: 0, converted: 0 });
    expect(calls[1]!.url.searchParams.get('deep')).toBe('true');
    expect(calls[1]!.url.searchParams.get('lang')).toBe('fr');
    expect(calls[3]!.url.searchParams.get('amount')).toBe('0');
    for (const call of calls) { expect(call.headers.get('X-API-Key')).toBe('fixture'); expect(call.headers.get('Parse-Version')).toBe('2.0.0'); }
    expect('mac' in parse).toBe(false); expect('measure' in parse).toBe(false);
  });
});
