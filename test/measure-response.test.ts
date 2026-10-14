import { expect, expectTypeOf, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAPI, type Measure } from '../src/index.js';

const cases = JSON.parse(readFileSync(new URL('./fixtures/measure-response.json', import.meta.url), 'utf8'));

it('decodes clean, invalid, ambiguous and legacy responses without changing their JSON', async () => {
  for (const body of cases) {
    const parse = parseAPI('fixture', { fetch: async () => Response.json(body) });
    const answer = await parse.measure(body.measure);
    expect(answer.amount).toBe(body.amount);
    expect(answer.reason).toBe(body.reason ?? null);
    expect(answer.choices).toEqual(body.choices ?? []);
    expect(Object.keys(answer)).toEqual(Object.keys(body));
    expect(JSON.parse(JSON.stringify(answer))).toEqual(body);
    expect(Object.getOwnPropertyDescriptor(answer, 'reason')?.enumerable).toBe(Object.hasOwn(body, 'reason'));
  }
  expectTypeOf<Measure['reason']>().toEqualTypeOf<string | null>();
  expectTypeOf<Measure['choices']>().toEqualTypeOf<{ unit: string; name: string }[]>();
});
