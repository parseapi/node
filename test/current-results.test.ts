import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Stack, type State, type District } from '../src/index.js';

it('uses the captured current wire models with one request and no fabricated fields', async () => {
	const fixtures = Object.fromEntries(['stack', 'state', 'district'].map(name => [name, JSON.parse(readFileSync(new URL(`./fixtures/current-${name}.json`, import.meta.url), 'utf8'))]));
	const calls: URL[] = [];
	const client = parseAPI('fixture', { fetch: async input => {
		const url = new URL(String(input)); calls.push(url);
		return Response.json(fixtures[url.pathname.split('/')[1]!]);
	} });
	const stack = await client.stack('stripe.com', { pretty: true });
	const state = await client.state('CA', { country: 'US' });
	const district = await client.district('36061', { country: 'US', state: 'NY' });
	expect(stack).toEqual(fixtures.stack);
	expect(state).toEqual(fixtures.state);
	expect(district).toEqual(fixtures.district);
	expect(calls.map(url => url.pathname + url.search)).toEqual(['/stack/stripe.com?pretty=true', '/state/CA?country=US', '/district/36061?country=US&state=NY']);
	expectTypeOf<Stack>().not.toHaveProperty('scope');
	expectTypeOf<Stack>().not.toHaveProperty('pages');
	expectTypeOf<Stack>().not.toHaveProperty('partial');
	expectTypeOf<State>().not.toHaveProperty('timezone');
	expectTypeOf<District>().not.toHaveProperty('timezone');
	expect(state.timezones).toEqual(['America/Los_Angeles']);
	expect(district.timezones).toEqual(['America/New_York']);
});

it('preserves unknown and empty collections in the current Stack view', async () => {
	const body = JSON.parse(readFileSync(new URL('./fixtures/current-stack.json', import.meta.url), 'utf8'));
	body.checked_at = null; body.cms = null; body.frameworks = [];
	const client = parseAPI('fixture', { fetch: async () => Response.json(body) });
	const result = await client.stack('stripe.com');
	expect(result.checked_at).toBeNull(); expect(result.cms).toBeNull(); expect(result.frameworks).toEqual([]);
	expect(result).not.toHaveProperty('pages');
});
