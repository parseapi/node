import { expect, expectTypeOf, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAPI, type Emoji, type EmojiDeep, type EmojiOptions, type EmojiSearch, type EmojiSearchOptions, type EmojiMetadata, type EmojiArtworkSource } from '../src/index.js';

it('accepts the published EmojiDeep construction with no new facts supplied', () => {
	const old: EmojiDeep = { codepoints: ['1F680'], hex: '1F680', status: 'fully-qualified', version: '1.0', keywords: ['rocket'], skins: [] };
	const record: Emoji = { emoji: '🚀', name: 'rocket', shortcodes: [':rocket:'], category: 'Travel & Places', deep: old };
	expect(record.deep?.variants).toBeUndefined();
	expect(record.deep?.artwork).toBeUndefined();
});

it('keeps existing method references and forwards filters, explicit false and named shortcodes', async () => {
	const calls: URL[] = [];
	const parse = parseAPI('test', { fetch: vi.fn(async input => { calls.push(new URL(String(input))); return new Response('{"q":"","emojis":[],"total":0,"next_offset":null}'); }) });
	const lookup: (value: string, options?: EmojiOptions) => Promise<Emoji> = parse.emoji;
	const search: (value: string, options?: EmojiSearchOptions) => Promise<EmojiSearch> = parse.emoji.search;
	await lookup(':cat:', { shortcodeSource: 'github', deep: true });
	await search('smile', { category: 'Smileys & Emotion', subcategory: 'face-smiling', version: '17.0', maxVersion: '18.0', includeSkinTones: false, offset: 0, limit: 2 });
	await parse.emoji.browse({ includeSkinTones: false, offset: 2 });
	await parse.emoji.categories();
	expect(calls[0]!.pathname).toBe('/emoji/%3Acat%3A');
	expect(Object.fromEntries(calls[0]!.searchParams)).toEqual({ shortcode_source: 'github', deep: 'true' });
	expect(Object.fromEntries(calls[1]!.searchParams)).toEqual({ q: 'smile', category: 'Smileys & Emotion', subcategory: 'face-smiling', version: '17.0', max_version: '18.0', include_skin_tones: 'false', offset: '0', limit: '2' });
	expect(Object.fromEntries(calls[2]!.searchParams)).toEqual({ include_skin_tones: 'false', offset: '2' });
	expect(calls[3]!.pathname).toBe('/emoji/categories');
	expect(calls[3]!.search).toBe('');
	expectTypeOf<EmojiSearch['total']>().toEqualTypeOf<number | undefined>();
});

it('posts raw text privately and preserves complete sequence metadata, counts and UTF-16 positions', async () => {
	const text = 'x 👍🏿 👍🏿';
	const payload = { emojis: [{ emoji: '👍🏿', name: 'thumbs up: dark skin tone', shortcodes: [], category: 'People & Body', positions: [{ start: 2, end: 6 }, { start: 7, end: 11 }], deep: { base: '👍', subcategory: 'hand-fingers-closed', variants: [{ emoji: '👍🏿', tones: ['dark'] }], shortcode_sources: { cldr: [], github: [], slack: [], discord: [] } } }], future: true };
	const fetch = vi.fn(async (input, init?: RequestInit) => {
		const url = new URL(String(input));
		expect(url.pathname).toBe('/emoji/parse');
		expect(Object.fromEntries(url.searchParams)).toEqual({ lang: 'fr', deep: 'true' });
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({ text });
		expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
		expect(init?.redirect).toBe('manual');
		return new Response(JSON.stringify(payload));
	});
	expect(await parseAPI('test', { fetch }).emoji.parse(text, { deep: true, lang: 'fr' })).toEqual(payload);
	expect(fetch).toHaveBeenCalledTimes(1);
});




it('converts private text with one request and explicit shortcode identity',async()=>{
 const fetch=vi.fn(async(input,init)=>{expect(new URL(String(input)).pathname).toBe('/emoji/convert');expect(init?.method).toBe('POST');expect(JSON.parse(init?.body as string)).toEqual({text:':rocket:'});return Response.json({text:'🚀',unresolved:[]});});
 expect((await parseAPI('test',{fetch}).emoji.convert(':rocket:',{direction:'to_emoji',shortcodeSource:'github'})).text).toBe('🚀');expect(fetch).toHaveBeenCalledTimes(1);
});
it('decodes the actual three-style rendering and provider credit response',async()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/emoji-artwork.json',import.meta.url),'utf8'));
 const client=parseAPI('test',{fetch:vi.fn(async input=>Response.json(String(input).includes('/metadata')?fixture.metadata:fixture.emoji))});
 expect((await client.emoji.metadata()).artwork_sources.map(a=>a.style)).toEqual(['noto','twemoji','openmoji']);
 const artwork=(await client.emoji('rocket',{deep:true})).deep!.artwork!;
 expect(Object.keys(artwork)).toEqual(['noto','twemoji','openmoji']);
 expect(artwork.openmoji?.svg).toBe('https://cdn.parseapi.com/emoji/openmoji/17.0.0/1f680.svg');
 expect(artwork.openmoji?.png?.['72']).toBe('https://cdn.parseapi.com/emoji/openmoji/17.0.0/72/1f680.png');
});
