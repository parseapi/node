import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EmojiCatalog } from '../dist/index.js';

const path = process.argv[2];
if (!path) throw new Error('Usage: node scripts/check-emoji-catalog-offline.mjs <catalog.json> [receipt.json]');
const text = await readFile(path, 'utf8'), data = JSON.parse(text);
let httpCalls = 0;
globalThis.fetch = () => { httpCalls++; throw new Error('Offline verification must not perform HTTP'); };
const start = performance.now(), local = new EmojiCatalog(data), failures = [];
let glyphs = 0, forms = 0, aliases = 0, ambiguous = 0, legacy = 0, nativeFacts = 0;
for (const row of data.emojis) {
  if (local.lookup(row.emoji).emoji !== row.emoji) failures.push(['glyph', row.emoji]);
  const parsed = local.parse(row.emoji);
  if (parsed.emojis.length !== 1 || parsed.emojis[0]?.emoji !== row.emoji || parsed.emojis[0]?.positions[0]?.end !== row.emoji.length) failures.push(['parse', row.emoji]);
  if (data.search) {
    const facts = data.search.native[row.emoji];
    if (!facts || (facts.name !== null && typeof facts.name !== 'string') || !Array.isArray(facts.keywords)) failures.push(['native search facts', row.emoji]);
    else if (data.search.locale === null && (facts.name !== row.name || JSON.stringify(facts.keywords) !== JSON.stringify(row.deep?.keywords))) failures.push(['native English projection', row.emoji]);
    nativeFacts++;
  }
  glyphs++;
}
for (const [form, canonical] of Object.entries(data.forms)) {
  if (local.lookup(form).emoji !== canonical) failures.push(['form', form]);
  forms++;
}
for (const [source, dictionary] of Object.entries(data.shortcodes)) for (const [alias, candidates] of Object.entries(dictionary)) {
  if (candidates.length === 1) {
    if (local.lookup(`:${alias}:`, { shortcodeSource: source }).emoji !== candidates[0]) failures.push(['alias', source, alias]);
    aliases++;
  } else {
    let rejected = false;
    try { local.lookup(`:${alias}:`, { shortcodeSource: source }); } catch (error) { rejected = error.code === 'validation_error'; }
    if (!rejected) failures.push(['ambiguous', source, alias]);
    ambiguous++;
  }
}
for (const [alias, canonical] of Object.entries(data.legacy)) {
  if (local.lookup(alias).emoji !== canonical) failures.push(['legacy', alias]);
  legacy++;
}
const search_winner_cases = [['Post Office','🏤'],['post_office','🏤'],['post-office','🏤'],['Whale','🐋'],['guardsman','💂‍♂️'],['Om','🕉️'],['Sunglasses','🕶️'],['ok_woman','🙆‍♀️'],['Pencil','✏️']];
for (const [query, expected] of search_winner_cases) if (local.scope().complete_inventory && local.search(query).emojis[0]?.emoji !== expected) failures.push(['legacy search winner', query, expected]);
const artwork = Object.fromEntries(data.metadata.artwork_sources.map(source => {
  // Compact records intentionally omit artwork; source coverage is not local artwork data.
  if (data.profile === 'compact') return [source.style, { included_in_records: false, source_loaded_coverage: source.loaded_coverage ?? null }];
  const entries = data.emojis.map(row => row.deep?.artwork?.[source.style]);
  const coverage = { available: entries.filter(Boolean).length, svg: entries.filter(art => art?.svg).length, png: entries.filter(art => Object.keys(art?.png ?? {}).length).length };
  if (local.scope().complete_inventory && source.loaded_coverage && (coverage.svg !== source.loaded_coverage.svg || coverage.png !== source.loaded_coverage.png)) failures.push(['artwork coverage', source.style]);
  return [source.style, coverage];
}));
// A filtered local snapshot retains the source-server evidence while reporting its own scope.
const subsetData = structuredClone(data);
subsetData.emojis = subsetData.emojis.filter(row => row.deep?.version === '18.0');
const selected = new Set(subsetData.emojis.map(row => row.emoji));
subsetData.total = selected.size;
subsetData.scope = { filters: { version: '18.0' }, total: selected.size, complete_inventory: selected.size === data.total };
subsetData.forms = Object.fromEntries(Object.entries(data.forms).filter(([, canonical]) => selected.has(canonical)));
subsetData.legacy = Object.fromEntries(Object.entries(data.legacy).filter(([, canonical]) => selected.has(canonical)));
subsetData.shortcodes = Object.fromEntries(Object.entries(data.shortcodes).map(([source, dictionary]) => [source,
  Object.fromEntries(Object.entries(dictionary).map(([alias, values]) => [alias, values.filter(glyph => selected.has(glyph))]).filter(([, values]) => values.length))]));
if (subsetData.search) subsetData.search.native = Object.fromEntries(Object.entries(subsetData.search.native).filter(([glyph]) => selected.has(glyph)));
if (subsetData.search?.localized_keywords) subsetData.search.localized_keywords = subsetData.search.localized_keywords.filter(glyph => selected.has(glyph));
const subset = new EmojiCatalog(subsetData);
const filtered_snapshot = { origin: 'in-memory subset of the browser download', scope: subset.scope(), metadata_server_emojis: subset.metadata().total, browsable_emojis: subset.browse().total };
if (filtered_snapshot.metadata_server_emojis !== data.metadata.total || filtered_snapshot.browsable_emojis !== selected.size || filtered_snapshot.scope.total !== selected.size) failures.push(['filtered scope']);
let localized_native_search = null;
if (data.search?.native['🌍']) {
  const localizedData = structuredClone(data), globe = localizedData.emojis.find(row => row.emoji === '🌍');
  globe.name = 'globe montrant Europe et Afrique';
  globe.deep.keywords = ['monde', 'terre'];
  localizedData.emojis = [globe]; localizedData.total = 1;
  localizedData.scope = { filters: {}, total: 1, complete_inventory: false };
  localizedData.search = { locale: 'fr', native: { '🌍': data.search.native['🌍'] } };
  const french = new EmojiCatalog(localizedData), queries = ['world','international','monde','terre'];
  for (const query of queries) if (french.search(query).emojis[0]?.emoji !== '🌍') failures.push(['localized native search', query]);
  localized_native_search = { origin: 'simulated French display projection of an actual browser-downloaded record', emoji: '🌍', queries };
}
const proof = { download: path, profile: data.profile ?? 'full', sha256: createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text), edition: local.metadata().edition,
  explicit_scope: data.scope ?? null, scope: local.scope(), glyph_lookup_and_parse_cases: glyphs, qualification_forms: forms,
  unambiguous_source_aliases: aliases, ambiguous_source_aliases: ambiguous, preserved_unsourced_winners: legacy, preserved_exact_search_cases: search_winner_cases.length,
  search_facts: data.search ? { locale: data.search.locale, native_records: Object.keys(data.search.native).length, checked_native_facts: nativeFacts, localized_keywords: data.search.localized_keywords?.length ?? null } : null, localization: data.localization ?? null, artwork, filtered_snapshot, localized_native_search,
  http_calls: httpCalls, failures, elapsed_ms: Math.round(performance.now() - start) };
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify(proof));
if (failures.length || httpCalls) process.exitCode = 1;
