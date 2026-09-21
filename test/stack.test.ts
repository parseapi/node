import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Stack, type StackOptions, type StackTechnology } from '../src/index.js';

const records = [
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": null,
    "scope": "homepage",
    "pages": 0,
    "partial": null,
    "cms": null,
    "servers": null,
    "frameworks": null,
    "ecommerce": null,
    "analytics": null,
    "chat": null,
    "payments": null,
    "hosting": null,
    "future": true
  },
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": "2026-09-21T12:00:00Z",
    "scope": "homepage",
    "pages": 1,
    "partial": true,
    "cms": [],
    "servers": [],
    "frameworks": [],
    "ecommerce": [],
    "analytics": [],
    "chat": [],
    "payments": [],
    "hosting": [],
    "deep": {},
    "future": true
  },
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": "2026-09-21T12:00:00Z",
    "scope": "homepage",
    "pages": 1,
    "partial": true,
    "cms": [
      {
        "technology": "wordpress",
        "name": "WordPress",
        "version": "6.8.2"
      }
    ],
    "servers": [
      {
        "technology": "nginx",
        "name": "nginx",
        "version": null
      }
    ],
    "frameworks": [
      {
        "technology": "react",
        "name": "React",
        "version": null
      }
    ],
    "ecommerce": [],
    "analytics": [],
    "chat": [],
    "payments": [],
    "hosting": [],
    "future": true
  },
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": "2026-09-21T12:00:00Z",
    "scope": "site",
    "pages": 6,
    "partial": false,
    "cms": [
      {
        "technology": "wordpress",
        "name": "WordPress",
        "version": "6.8.2"
      },
      {
        "technology": "ghost",
        "name": "Ghost",
        "version": null
      }
    ],
    "servers": [
      {
        "technology": "nginx",
        "name": "nginx",
        "version": null
      },
      {
        "technology": "apache",
        "name": "Apache",
        "version": null
      }
    ],
    "frameworks": [
      {
        "technology": "nextjs",
        "name": "Next.js",
        "version": "15.0.0",
        "future": true
      },
      {
        "technology": "react",
        "name": "React",
        "version": null
      }
    ],
    "ecommerce": [
      {
        "technology": "woocommerce",
        "name": "WooCommerce",
        "version": null
      }
    ],
    "analytics": [
      {
        "technology": "google-analytics",
        "name": "Google Analytics",
        "version": null
      }
    ],
    "chat": [
      {
        "technology": "intercom",
        "name": "Intercom",
        "version": null
      }
    ],
    "payments": [
      {
        "technology": "stripe",
        "name": "Stripe",
        "version": null
      }
    ],
    "hosting": [
      {
        "technology": "vercel",
        "name": "Vercel",
        "version": null
      }
    ],
    "future": true
  },
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": "2026-09-21T12:00:00Z",
    "scope": "site",
    "pages": 3,
    "partial": true,
    "cms": [],
    "servers": [],
    "frameworks": [
      {
        "technology": "nextjs",
        "name": "Next.js",
        "version": null,
        "future": true
      }
    ],
    "ecommerce": [],
    "analytics": [],
    "chat": [],
    "payments": [],
    "hosting": [],
    "deep": {},
    "future": true
  },
  {
    "domain": "xn--bcher-kva.example",
    "url": "https://xn--bcher-kva.example/",
    "checked_at": null,
    "scope": "site",
    "pages": 0,
    "partial": null,
    "cms": null,
    "servers": null,
    "frameworks": null,
    "ecommerce": null,
    "analytics": null,
    "chat": null,
    "payments": null,
    "hosting": null,
    "deep": {},
    "future": true
  }
] as const;
it('Stack preserves homepage and site inventories, multiple CMS and servers, and future fields', async () => {
	for (const record of records) {
		const fetch = vi.fn(async () => Response.json(record));
		const parse = parseAPI('test_key', { fetch });
		const options: StackOptions = { deep: true, pretty: true, retries: 0 };
		expectTypeOf(parse.stack).returns.toEqualTypeOf<Promise<Stack>>();
		expect(await parse.stack('bücher.example', options)).toEqual(record);
		const [input, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		const url = new URL(input);
		expect(url.pathname).toBe('/stack/b%C3%BCcher.example');
		expect(Object.fromEntries(url.searchParams)).toEqual({ deep: 'true', pretty: 'true' });
		expect(new Headers(init.headers).get('parse-version')).toBe('2.0.0');
	}
});
it('Stack default call omits optional query parameters and preserves omitted deep', async () => {
	let observed = '';
	const parse = parseAPI('test_key', { fetch: async input => { observed = String(input); return Response.json(records[0]); } });
	const result = await parse.stack('example.com');
	expect(new URL(observed).search).toBe('');
	expect(result.frameworks).toBeNull();
	expect(result).not.toHaveProperty('deep');
});

it('Stack gets its own deadline while explicit client and request settings win', async () => {
	const timer = vi.spyOn(globalThis, 'setTimeout');
	try {
		for (const [clientTimeout, requestTimeout, expected] of [
			[undefined, undefined, 35000], [10000, undefined, 10000],
			[45000, undefined, 45000], [45000, 1200, 1200], [undefined, 1200, 1200],
		] as const) {
			const parse = parseAPI('test_key', { timeoutMs: clientTimeout, fetch: async () => Response.json({ ...records[0], deep: {} }) });
			timer.mockClear();
			expect((await parse.stack('example.com', { timeoutMs: requestTimeout })).deep).toEqual({});
			expect(timer.mock.calls.map(call => call[1])).toEqual([expected]);
			timer.mockClear();
			await parse.domain('example.com');
			expect(timer.mock.calls.map(call => call[1])).toEqual([clientTimeout ?? 10000]);
		}
	} finally { timer.mockRestore(); }
});

it('Stack exposes each technology once and has no optional public details', () => {
	expectTypeOf<keyof StackTechnology>().toEqualTypeOf<'technology' | 'name' | 'version'>();
	expectTypeOf<StackTechnology['version']>().toEqualTypeOf<string | null>();
	expectTypeOf<Stack['cms' | 'servers' | 'frameworks' | 'ecommerce' | 'analytics' | 'chat' | 'payments' | 'hosting']>().toEqualTypeOf<StackTechnology[] | null>();
	expectTypeOf<Stack['scope']>().toEqualTypeOf<'homepage' | 'site'>();
	expectTypeOf<Stack['pages']>().toEqualTypeOf<number>();
	expectTypeOf<Stack['partial']>().toEqualTypeOf<boolean | null>();
	expectTypeOf<keyof Stack>().toEqualTypeOf<'domain' | 'url' | 'checked_at' | 'scope' | 'pages' | 'partial' | 'cms' | 'servers' | 'frameworks' | 'ecommerce' | 'analytics' | 'chat' | 'payments' | 'hosting' | 'deep'>();
	expectTypeOf<Stack['deep']>().toEqualTypeOf<Record<string, never> | undefined>();
	for (const record of records) {
		if ('deep' in record) expect(record.deep).toEqual({});
		expect(JSON.stringify(record)).not.toMatch(/"(?:status|evidence|detector_version|id|category|technologies|observed_at|cms_name|cms_version|server|server_name|server_version)":/);
	}
});
