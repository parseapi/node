import { expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';
it('exposes no current Banking methods while preserving Card and Country', () => {
 const client = parseAPI('test');
 for (const name of ['bank','iban','ach','routing','bankUsAch','bankRequirements','ibanRequirements','achRequirements']) expect(name in client, name).toBe(false);
 expect(typeof client.card).toBe('function'); expect(typeof client.country).toBe('function');
});
