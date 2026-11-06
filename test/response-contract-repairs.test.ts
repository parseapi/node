import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Card, type CardDeep, type Deep, type PointDeep, type PostalDeep, type PostalPropertyTax } from '../src/index.js';

// The old declaration accepted this unsafe access. Keeping the negative type
// check prevents an empty, truthy Deep object from becoming falsely complete.
function unsafeIssuerAccess(card: Card) {
  if (card.issuer !== null) {
    // @ts-expect-error Locked/partial Deep may omit issuer.
    return card.issuer.toUpperCase();
  }
  return null;
}
void unsafeIssuerAccess;

it('types and reads omitted, locked and unknown Card detail honestly', async () => {
  expectTypeOf<Card['issuer']>().toEqualTypeOf<string | null | undefined>();
  const bodies = [
    { bin: '411111', brand: 'visa', brand_name: 'Visa', logo: 'https://example.com/visa.svg' },
    { bin: '411111', brand: 'visa', brand_name: 'Visa', logo: 'https://example.com/visa.svg', ...{} },
    { bin: '411111', brand: 'visa', brand_name: 'Visa', logo: 'https://example.com/visa.svg', ...{ issuer: null, prepaid: false } },
    { bin: '411111', brand: 'visa', brand_name: 'Visa', logo: 'https://example.com/visa.svg', ...{ issuer: 'Example bank', prepaid: false, future: true } },
  ];
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
  expect((await parse.card('411111'))).not.toHaveProperty('deep');
  const locked = await parse.card('411111', { deep: true });
  expect(locked).not.toHaveProperty('deep');
  expect(typeof locked?.issuer === 'string' ? locked.issuer.toUpperCase() : null).toBeNull();
  const unknown = await parse.card('411111', { deep: true });
  expect(unknown?.issuer).toBeNull();
  expect(unknown?.prepaid).toBe(false);
  const rich = await parse.card('411111', { deep: true });
  expect(rich?.issuer).toBe('Example bank');
  expect(rich?.prepaid).toBe(false);
});

it('accepts the compact Postal tax record without inventing nested currency or period', async () => {
  expectTypeOf<PostalDeep['property_tax']>().toEqualTypeOf<PostalPropertyTax | null | undefined>();
  const bodies = [{ postal: '10001', country: 'US' }, { postal: '10001', country: 'US', ...{} },
    { postal: '10001', country: 'US', ...{ property_tax: null } },
    { postal: '10001', country: 'US', ...{ currency: 'USD', property_tax: { annual_median: 0 }, future: true } },
    { postal: '10001', country: 'US', ...{ property_tax: { annual_median: 1234.5, currency: 'USD', period: '2020-2024' } } }];
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
  expect((await parse.postal('10001'))).not.toHaveProperty('deep');
  expect((await parse.postal('10001', { deep: true }))).not.toHaveProperty('deep');
  expect((await parse.postal('10001', { deep: true }))?.property_tax).toBeNull();
  const rich = await parse.postal('10001', { deep: true });
  expect(rich?.property_tax).toEqual({ annual_median: 0 });
  expect(rich?.currency).toBe('USD');
  expect(rich?.property_tax?.currency).toBeUndefined();
  expect(rich?.property_tax?.period).toBeUndefined();
  const legacy = await parse.postal('10001', { deep: true });
  expect(legacy?.property_tax?.annual_median).toBe(1234.5);
  expect(legacy?.property_tax?.currency).toBe('USD');
  expect(legacy?.property_tax?.period).toBe('2020-2024');
  expect(JSON.parse(JSON.stringify(rich?.property_tax))).toEqual({ annual_median: 0 });
});

it('exposes Point terrain and electoral values, retaining zeros, nulls and leading zeros', async () => {
  const older: PointDeep = { city: null, elevation: null, elevation_ft: null, resolution: null };
  expect(older.electoral).toBeUndefined();
  const bodies = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0, ...{} },
    { latitude: 0, longitude: 0, ...{ elevation: null, electoral: null } },
    { latitude: 0, longitude: 0, ...{ elevation: 0, elevation_ft: 0, electoral: { code: '0801', name: null, congress: 119, future: true } } },
    { latitude: 0, longitude: 0, ...{ elevation: -1.5, electoral: { code: '0200', name: 'At-large', congress: null } } }];
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
  expect((await parse.point(0, 0))).not.toHaveProperty('deep');
  expect((await parse.point(0, 0, { deep: true }))).not.toHaveProperty('deep');
  expect((await parse.point(0, 0, { deep: true }))?.electoral).toBeNull();
  const zero = await parse.point(0, 0, { deep: true });
  expect(zero?.elevation).toBe(0);
  expect(zero?.electoral?.code).toBe('0801');
  expect(zero?.electoral?.name).toBeNull();
  expect(zero?.electoral?.congress).toBe(119);
  const belowSea = await parse.point(0, 0, { deep: true });
  expect(belowSea?.elevation).toBe(-1.5);
  expect(belowSea?.electoral?.congress).toBeNull();
});
