import { expect, it, vi } from 'vitest';
import { EmojiCatalog, EmojiCatalogError, parseAPI, type EmojiCatalogData, type Emoji } from '../src/index.js';

function fixture(): EmojiCatalogData {
  const row = (emoji: string, name: string, version: string, keywords: string[], subcategory = 'animal-mammal'): Emoji => ({
    emoji, name, category: 'Animals & Nature', shortcodes: [`:${name}:`, name],
    deep: { version, keywords, subcategory },
  });
  const cat = row('🐈', 'cat', '0.6', ['pet', 'cat']);
  const face = row('🐱', 'cat face', '0.6', ['pet', 'face']);
  const heart = row('❤️', 'cœur', '0.6', ['émotion', 'love'], 'emotion');
  const tone = row('👍🏿', 'thumbs up: dark skin tone', '1.0', ['hand']);
  const whale = row('🫍', 'orca', '18.0', ['sea', 'whale']);
  return {
    metadata: { edition: 'fixture', max_version: '18.0', source_version: '18.0', sources: [], artwork_sources: [], notices: [],
      total: 5,
      completeness: { missing_count: 1, unexpected_count: 0 } },
    total: 5, emojis: [cat, face, heart, tone, whale],
    forms: { '🐈': '🐈', '🐱': '🐱', '❤️': '❤️', '❤': '❤️', '👍🏿': '👍🏿', '🫍': '🫍' },
    shortcodes: { cldr: { cat: ['🐈'], shared: ['🐈'], coeur: ['❤️'] }, github: { cat: ['🐱'], shared: ['🐱'] }, slack: {}, discord: {} },
    legacy: { cat: '🐈', 'cat_face': '🐱', 'cœur': '❤️' },
  };
}

it('resolves source identities, qualification forms and codepoints without fetching', () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('unexpected HTTP'); });
  try {
    const catalog = new EmojiCatalog(fixture());
    expect(catalog.lookup('cat').emoji).toBe('🐈');
    expect(catalog.lookup(':cat:', { shortcodeSource: 'github' }).emoji).toBe('🐱');
    expect(catalog.lookup('2764').emoji).toBe('❤️');
    expect(catalog.lookup('U+2764 U+FE0F').emoji).toBe('❤️');
    expect(catalog.lookup('❤').emoji).toBe('❤️');
    expect(() => catalog.lookup('shared')).toThrow('ambiguous');
    expect(() => catalog.lookup('U+D800')).toThrow('scalar');
    expect(() => catalog.lookup('no such emoji')).toThrow(EmojiCatalogError);
    expect(catalog.lookup('cat').deep).toBeUndefined();
    expect(catalog.lookup('cat', { deep: true }).deep?.version).toBe('0.6');
    expect(fetch).not.toHaveBeenCalled();
  } finally { fetch.mockRestore(); }
});

it('filters and pages downloaded inventory, preserving false and explicit zero', () => {
  const catalog = new EmojiCatalog(fixture());
  expect(catalog.browse({ category: 'animals-nature', includeSkinTones: false, maxVersion: '17.0', limit: 2, offset: 0 })).toMatchObject({ total: 3, next_offset: 2, emojis: [{ emoji: '🐈' }, { emoji: '🐱' }] });
  expect(catalog.browse({ version: '18.0' }).emojis.map(row => row.emoji)).toEqual(['🫍']);
  expect(catalog.browse({ subcategory: 'emotion' }).emojis.map(row => row.emoji)).toEqual(['❤️']);
  expect(catalog.search('cat')).not.toHaveProperty('total');
  expect(catalog.search('cat', { offset: 0 }).total).toBe(2);
  expect(catalog.categories().categories[0]?.subcategories).toEqual(['animal-mammal', 'emotion']);
  expect(() => catalog.browse({ category: 'not-a-category' })).toThrow('Unknown');
  expect(() => catalog.browse({ offset: -1 })).toThrow('Offset');
  for (const limit of [-1, 0, 0.5, NaN, Infinity]) expect(() => catalog.browse({ limit })).toThrow('Limit');
  expect(() => catalog.browse({ maxVersion: '19.0' })).toThrow('no newer');
});

it('searches accents, ligatures and words across labels with stable ranking', () => {
  const catalog = new EmojiCatalog(fixture());
  expect(catalog.search('coeur').emojis[0]?.emoji).toBe('❤️');
  expect(catalog.search('ca\u1AB0t').emojis[0]?.emoji).toBe('🐈');
  expect(catalog.search('emotion').emojis[0]?.emoji).toBe('❤️');
  expect(catalog.search('pet face').emojis.map(row => row.emoji)).toEqual(['🐱']);
  expect(catalog.search('sea whale').emojis[0]?.emoji).toBe('🫍');
});

it('keeps primary exact matches ahead of added aliases and unordered labels ahead of keywords', () => {
  const data = fixture();
  data.emojis[0]!.name = 'zebra label';
  data.emojis[1]!.name = 'aardvark label';
  expect(new EmojiCatalog(data).search('cat').emojis.map(row => row.emoji)).toEqual(['🐈', '🐱']);
  const words = fixture();
  words.emojis[0]!.deep!.keywords!.push('face cat');
  expect(new EmojiCatalog(words).search('face cat').emojis.map(row => row.emoji)).toEqual(['🐱', '🐈']);
});

it('retains native English search facts in localized downloads', () => {
  const data = fixture();
  data.localization={requested_locale:'fr',resolved_locale:'fr',translated_names:1,translated_keywords:1,fallback_names:4,fallback_keywords:4};
  data.search = { native: { '❤️': { name: 'red heart', keywords: ['world', 'international'] } } };
  const catalog = new EmojiCatalog(data);
  expect(catalog.search('world').emojis[0]?.emoji).toBe('❤️');
  expect(catalog.search('international').emojis[0]?.name).toBe('cœur');
  expect(catalog.search('red heart').emojis[0]?.emoji).toBe('❤️');
  expect(catalog.search('coeur').emojis[0]?.emoji).toBe('❤️');
});

it('boosts genuine exact translated keywords while leaving fallback English tiers intact', () => {
 const data=fixture();data.localization={requested_locale:'ar',resolved_locale:'ar',translated_names:2,translated_keywords:1,fallback_names:3,fallback_keywords:4};data.search={native:{},localized_keywords:['❤️']};
 data.emojis[0]!.name='صنارة صيد';data.emojis[2]!.name='قلب';data.emojis[2]!.deep!.keywords=['نار'];
 expect(new EmojiCatalog(data).search('نار').emojis[0]?.emoji).toBe('❤️');
 delete data.search.localized_keywords;
 expect(new EmojiCatalog(data).search('نار').emojis[0]?.emoji).toBe('🐈');
});

it('indexes compact source maps without inventing omitted artwork details', () => {
  const data = fixture();
  data.profile = 'compact';
  data.shortcodes.discord = { feline_friend: ['🐱'] };
  const local = new EmojiCatalog(data);
  expect(local.search('feline friend').emojis.map(row => row.emoji)).toEqual(['🐱']);
  expect(local.lookup('feline_friend', { shortcodeSource: 'discord', deep: true }).deep).not.toHaveProperty('artwork');
  expect(local.lookup('feline_friend', { shortcodeSource: 'discord', deep: true }).deep).not.toHaveProperty('shortcode_sources');
  expect(local.parse('🐱').emojis).toHaveLength(1);
});

it('parses entire grapheme clusters, groups repeats and reports original UTF-16 positions', () => {
  const catalog = new EmojiCatalog(fixture());
  const result = catalog.parse('x ❤ ❤️ 👍🏿 👍🏿');
  expect(result.emojis.flatMap(row=>row.positions)).toHaveLength(4);
  expect(result.emojis).toMatchObject([
    { emoji: '❤️', positions: [{ start: 2, end: 3 }, { start: 4, end: 6 }] },
    { emoji: '👍🏿', positions: [{ start: 7, end: 11 }, { start: 12, end: 16 }] },
  ]);
  expect(catalog.parse('🏿 🐈\u200d🚀 🇺').emojis).toEqual([]);
  expect(catalog.parse('').emojis).toEqual([]);
  expect(() => catalog.parse('a'.repeat(16001))).toThrow('16000');
});

it('snapshots downloaded data and isolates returned objects from later mutation', () => {
  const data = fixture(), catalog = new EmojiCatalog(data);
  data.emojis[0]!.name = 'changed';
  const row = catalog.lookup('cat', { deep: true });
  row.name = 'also changed';
  row.deep!.keywords!.push('changed');
  row.shortcodes.push(':changed:');
  const metadata = catalog.metadata();
  metadata.completeness.missing_count=0;
  expect(catalog.lookup('cat', { deep: true }).name).toBe('cat');
  expect(catalog.lookup('cat', { deep: true }).deep?.keywords).toEqual(['pet', 'cat']);
  expect(catalog.lookup('cat').shortcodes).not.toContain(':changed:');
  expect(catalog.metadata().completeness.missing_count).toBe(1);
  expect(catalog.scope()).toEqual({filters:{},total:5,complete_inventory:true});
  const subset = fixture();
  subset.emojis = subset.emojis.slice(0,1); subset.total=1; subset.scope={filters:{version:'0.6'},complete_inventory:false};
  const partial = new EmojiCatalog(subset);
  expect(partial.metadata().total).toBe(5);
  expect(partial.scope()).toEqual({filters:{version:'0.6'},total:1,complete_inventory:false});
  const noDeep = fixture();
  delete noDeep.emojis[0]!.deep;
  expect(() => new EmojiCatalog(noDeep)).toThrow('deep=true');
});

it('downloads JSON snapshots with existing transport controls', async () => {
  const fetch = vi.fn(async (input, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
    if (url.pathname === '/emoji/metadata') return Response.json(fixture().metadata);
    expect(url.pathname).toBe('/emoji/catalog');
    return Response.json(fixture());
  });
  const parse = parseAPI('test', { fetch });
  const data = await parse.emoji.catalog({ includeSkinTones: false, category: 'Animals & Nature', profile: 'compact' });
  expect(new URL(String(fetch.mock.calls[0]![0])).searchParams.get('profile')).toBe('compact');
  expect(new URL(String(fetch.mock.calls[0]![0])).searchParams.get('deep')).toBe('true');
  expect(new EmojiCatalog(data).lookup('cat').emoji).toBe('🐈');
  expect((await parse.emoji.metadata()).total).toBe(5);
});




it('converts with original offsets and literal unknowns', () => {
  const catalog=new EmojiCatalog(fixture());
  const decoded=catalog.convert('x :cat: :nope:',{direction:'to_emoji',shortcodeSource:'github'});
  expect(decoded).toMatchObject({text:'x 🐱 :nope:',unresolved:[{shortcode:':nope:',start:8,end:14,reason:'unknown'}]});
  expect(catalog.convert('x ❤ 🫍',{direction:'to_shortcodes',shortcodeSource:'cldr'})).toMatchObject({text:'x :coeur: 🫍',unresolved:[{emoji:'🫍',reason:'unavailable',start:4,end:6}]});
  const ambiguous=fixture(); ambiguous.shortcodes.cldr.shared=['🐈','🐱'];
  expect(new EmojiCatalog(ambiguous).convert(':shared:',{direction:'to_emoji',shortcodeSource:'cldr'}).unresolved[0]?.reason).toBe('ambiguous');
  expect(()=>catalog.convert('x'.repeat(16001),{direction:'to_emoji',shortcodeSource:'cldr'})).toThrow('16000');
});

it('creates whole-grapheme regexes ', () => {
  const catalog=new EmojiCatalog(fixture()), regex=catalog.regex();
  expect(regex.test('❤')).toBe(true); expect(regex.test('🐈\u200d🚀')).toBe(false); expect(regex.test('❤\ufe0e')).toBe(false);
  expect(catalog.regex({qualifiedOnly:true}).test('❤')).toBe(false);
  expect(regex.test('🏿')).toBe(false); expect(catalog.regex({components:true}).test('🏿')).toBe(true);
});
