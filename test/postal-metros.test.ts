import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Postal, type PostalMetro, type PostalNearby, type PostalNearbyItem, type PostalDistanceEnd } from '../src/index.js';

const metro = {
	code: '12345', name: 'Example area', type: 'future-area-type',
	share: 0.75, residential_share: 0, business_share: 1, other_share: null,
	future: { value: true },
};

it.each([undefined, null, [], [metro]])('preserves metro observations on every postal response: %j', async metros => {
	const member = { postal: '12345', country: 'US', city: null, state: null, distance: 0, distance_mi: 0, future: true, ...(metros === undefined ? {} : { metros }) };
	const bodies = [member, { ...member, radius: 10, unit: 'km', nearby: [member] }, { country: 'US', from: member, to: member, distance: 0, distance_mi: 0 }];
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
	const postal = await parse.postal('12345');
	const nearby = await parse.postal.nearby('12345');
	const distance = await parse.postal.distance('12345', '12345');
	for (const value of [postal.metros, nearby.metros, nearby.nearby[0]!.metros, distance.from.metros, distance.to.metros]) {
		expect(value).toEqual(metros);
	}
	expect(postal).toMatchObject({ future: true });
	if (metros?.length) expect(postal.metros?.[0]).toMatchObject({ future: { value: true }, residential_share: 0, business_share: 1, other_share: null });
});

it('keeps additions optional for existing typed consumers and the area type open', () => {
	expectTypeOf<Postal['metros']>().toEqualTypeOf<PostalMetro[] | null | undefined>();
	expectTypeOf<PostalNearby['metros']>().toEqualTypeOf<PostalMetro[] | null | undefined>();
	expectTypeOf<PostalNearbyItem['metros']>().toEqualTypeOf<PostalMetro[] | null | undefined>();
	expectTypeOf<PostalDistanceEnd['metros']>().toEqualTypeOf<PostalMetro[] | null | undefined>();
	expectTypeOf<PostalMetro['type']>().toEqualTypeOf<string>();
	const oldEnd: PostalDistanceEnd = { postal: '12345', city: null };
	expect(oldEnd.metros).toBeUndefined();
});
