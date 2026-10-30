import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Ip } from '../src/index.js';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/network-contracts.json', import.meta.url), 'utf8'));

it('exposes optional IP geography without requiring it on frozen or locked results', async () => {
    expectTypeOf<NonNullable<Ip['deep']>['district']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<NonNullable<Ip['deep']>['district_name']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<NonNullable<Ip['deep']>['census_division']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<NonNullable<Ip['deep']>['census_region']>().toEqualTypeOf<string | null | undefined>();
    for (const name of ['ip_current', 'ip_frozen', 'ip_locked']) {
        const calls: string[] = [];
        const client = parseAPI('fixture', { fetch: async input => { calls.push(String(input)); return Response.json(fixtures[name]); } });
        const result = await client.ip('198.51.100.1', { deep: true });
        expect(result).toEqual(fixtures[name]);
        expect(calls).toHaveLength(1);
        if (name === 'ip_current') expect(result.deep?.district).toBe('27053');
        else expect(result.deep?.district).toBeUndefined();
    }
});

it('preserves the State and District timezones on the existing calls', async () => {
    for (const [kind, code, options, zones] of [
        ['state', 'CA', { country: 'US' }, ['America/Los_Angeles']],
        ['district', '36061', { country: 'US', state: 'NY' }, ['America/New_York']],
    ] as const) {
        const calls: string[] = [];
        const client = parseAPI('fixture', { fetch: async input => { calls.push(String(input)); return Response.json(fixtures[`${kind}_current`]); } });
        const result = await client[kind](code, options);
        expectTypeOf(result.timezones).toEqualTypeOf<string[]>();
        expect(result.timezones).toEqual(zones);
        expect(calls).toHaveLength(1);
        expect(calls[0]).toContain(`/${kind}/${code}?country=US`);
        expect(calls[0]).not.toContain('deep=');
    }
});
