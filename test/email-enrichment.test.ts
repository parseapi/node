import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Email, type EmailDeep } from '../src/index.js';

it('keeps email enrichment nullable and accepts older results and future codes', async () => {
	const original = { email: 'jane.doe+news@example.com', valid: true, free: false, role: false, disposable: false, domain: 'example.com', domain_type: null, domain_valid: true, didyoumean: null } satisfies Email;
	for (const extra of [
		{}, {},
		{ first_name: null, no_reply: null, tag: null, mail_provider: null, deliverable: null, catchall: null, status: null, reason: null },
		{ future: true, first_name: 'Jane', no_reply: false, tag: 'news', mail_provider: 'future-provider', deliverable: true, catchall: false, status: 'future-status', reason: 'future_reason' },
	]) {
		const body = { ...original, ...extra };
		const parse = parseAPI('fixture', { fetch: async () => Response.json(body) });
		const result = await parse.email(original.email, { deep: true });
		expect(result).toEqual(body);
		expectTypeOf(result?.first_name).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result?.no_reply).toEqualTypeOf<boolean | null | undefined>();
		expectTypeOf(result?.tag).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result?.mail_provider).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result?.status).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result?.reason).toEqualTypeOf<string | null | undefined>();
		expectTypeOf<Email['first_name']>().toEqualTypeOf<string | null | undefined>();
		expectTypeOf<EmailDeep>().not.toHaveProperty('quality');
	}
});
