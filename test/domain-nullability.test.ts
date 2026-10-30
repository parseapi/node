import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Domain, type DomainRegistration } from '../src/index.js';

it('decodes unknown and both known availability states through ordinary domain', async () => {
  for (const available of [null, false, true]) for (const dnssec of [undefined, null, false, true]) {
    const registration = available === true ? { registered: false } : { registered: true, dnssec };
    const body = { domain: 'example.com', available, deep: available === null ? {} : { registration } };
    let calls = 0;
    const client = parseAPI('fixture', { retries: 0, fetch: async (input) => {
      calls++; expect(new URL(String(input)).pathname).toBe('/domain/example.com');
      expect(new URL(String(input)).search).toBe('?deep=true');
      return Response.json(body);
    } });
    const result: Domain = await client.domain('example.com', { deep: true });
    expect(result.available).toBe(available);
    expect(result).toEqual(JSON.parse(JSON.stringify(body)));
    if (available === false) expect(result.deep?.registration?.dnssec).toBe(dnssec);
    expect(calls).toBe(1);
  }
  expectTypeOf<Domain['available']>().toEqualTypeOf<boolean | null>();
  expectTypeOf<DomainRegistration['dnssec']>().toEqualTypeOf<boolean | null | undefined>();
  const partial: DomainRegistration = { registered: false };
  expect(partial.dnssec).toBeUndefined();
});

it('keeps API errors on the ordinary method without another lookup', async () => {
  let calls = 0;
  const client = parseAPI('fixture', { retries: 0, fetch: async () => {
    calls++; return Response.json({ code: 'service_unavailable', message: 'Try later', request_id: 'fixture' }, { status: 503 });
  } });
  await expect(client.domain('example.com')).rejects.toMatchObject({ status: 503, code: 'service_unavailable' });
  expect(calls).toBe(1);
});
