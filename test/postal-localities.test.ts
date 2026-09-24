import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Postal, type PostalLocality, type PostalNearbyItem, type PostalDistanceEnd } from '../src/index.js';

const choice = { city: 'SYDNEY', state: 'NSW', state_name: 'New South Wales', future: true };
const other = { city: 'HAYMARKET', state: 'NSW', state_name: 'New South Wales' };

it.each([undefined, null, [], [choice], [choice, other]])('preserves core suburb choices without inferring a city: %j', async localities => {
	const body = { postal: '2000', country: 'AU', city: null, ...(localities === undefined ? {} : { localities }) };
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(body)) });
	const result = await parse.postal('2000', { country: 'AU' });
	expect(result).toEqual(body);
	expect(result.city).toBeNull();
	expect(result.localities).toEqual(localities);
});

it('keeps the addition optional and limited to full lookup results', () => {
	expectTypeOf<Postal['localities']>().toEqualTypeOf<PostalLocality[] | null | undefined>();
	expectTypeOf<PostalLocality>().toEqualTypeOf<{ city: string; state: string; state_name: string }>();
	expectTypeOf<'localities' extends keyof PostalNearbyItem ? true : false>().toEqualTypeOf<false>();
	expectTypeOf<'localities' extends keyof PostalDistanceEnd ? true : false>().toEqualTypeOf<false>();
});
