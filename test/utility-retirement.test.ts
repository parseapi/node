import { expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';

it('omits retired utilities while keeping lead and place enrichment clients', () => {
	const client = parseAPI('test');
	for (const name of ['mac', 'measure']) expect(name in client, name).toBe(false);
	for (const name of ['company', 'industry', 'country', 'postal', 'phone', 'email']) {
		expect(typeof Reflect.get(client, name), name).toBe('function');
	}
});
