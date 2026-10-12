import type { Emoji, EmojiBrowse, EmojiCategories, EmojiCatalogData, EmojiCatalogScope, EmojiMetadata, EmojiParse, EmojiSearch, EmojiConversion } from './types.js';

export interface EmojiCatalogLookupOptions { deep?: boolean; shortcodeSource?: string; }
export interface EmojiCatalogSearchOptions {
  deep?: boolean;
  limit?: number;
  offset?: number;
  category?: string;
  subcategory?: string;
  version?: string;
  maxVersion?: string;
  includeSkinTones?: boolean;
}
export interface EmojiCatalogParseOptions { deep?: boolean; }
export interface EmojiCatalogConvertOptions { direction: 'to_shortcodes' | 'to_emoji'; shortcodeSource: 'cldr' | 'github' | 'slack' | 'discord'; }
export interface EmojiCatalogRegexOptions { qualifiedOnly?: boolean; components?: boolean; }

/** A local validation or resolution failure. No HTTP request was made. */
export class EmojiCatalogError extends Error {
  constructor(readonly code: 'validation_error' | 'not_found' | 'invalid_catalog', message: string) {
    super(message);
    this.name = 'EmojiCatalogError';
  }
}

const sources = ['cldr', 'github', 'slack', 'discord'] as const;
const stripColons = (value: string) => value.trim().replace(/^:+|:+$/g, '');
const normalizeName = (value: string) => stripColons(value).toLowerCase().replace(/[\s_-]+/g, '_');
const normalizeSearch = (value: string) => normalizeName(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
const legacyName = (value: string) => stripColons(value).toLowerCase().replace(/\s+/g, '_');
const filterKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const versionCompare = (a: string, b: string) => {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  return (left[0] ?? 0) - (right[0] ?? 0) || (left[1] ?? 0) - (right[1] ?? 0);
};
const invalid = (message: string): never => { throw new EmojiCatalogError('validation_error', message); };

/** Immutable local snapshot. All operations are synchronous and use no network. */
export class EmojiCatalog {
  private readonly data: EmojiCatalogData;
  private readonly byGlyph = new Map<string, Emoji>();
  private readonly names = new Map<string, Set<string>>();
  private readonly aliases = new Map<string, Set<string>>();
  private readonly sourceAliases = new Map<string, Set<string>>();
  private readonly encodings = new Map<string, Map<string,string>>();
  private readonly searchFacts = new Map<string,{ names: string[]; primaryShorts: string[]; shorts: string[]; keywords: string[]; translatedKeywords: string[]; allNames: string[]; blob: string }>();
  private readonly categoryKeys = new Set<string>();
  private readonly subcategoryKeys = new Set<string>();
  private readonly filterCache = new Map<string, Emoji[]>();
  private searchReady = false;
  private readonly compareNames: (a: string, b: string) => number;
  private segmenter?: Intl.Segmenter;

  constructor(data: EmojiCatalogData) {
    if (!data || !Array.isArray(data.emojis) || !data.forms || !data.shortcodes || !data.legacy || !data.metadata?.source_version) {
      throw new EmojiCatalogError('invalid_catalog', 'Use the JSON response from GET /emoji/catalog.');
    }
    this.data = structuredClone(data);
    this.compareNames = new Intl.Collator(this.data.localization?.resolved_locale ?? undefined).compare;
    const add = (map: Map<string, Set<string>>, key: string, glyph: string) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(glyph);
    };
    for (const row of this.data.emojis) {
      if (!row?.emoji || !row.deep?.version || !Array.isArray(row.deep.keywords)) {
        throw new EmojiCatalogError('invalid_catalog', 'Offline catalogs require the default deep=true export.');
      }
      this.byGlyph.set(row.emoji, row);
      add(this.names, normalizeName(row.name), row.emoji);
      for (const alias of row.shortcodes) add(this.aliases, normalizeName(alias), row.emoji);
      this.categoryKeys.add(filterKey(row.category ?? ''));
      this.subcategoryKeys.add(filterKey(row.deep.subcategory ?? ''));
    }
    for (const source of sources) {
      if (!this.data.shortcodes[source]) throw new EmojiCatalogError('invalid_catalog', `Catalog is missing the ${source} shortcode map.`);
    }
  }

  /** Build once on first search; shared normalized strings avoid repeated annotation copies. */
  private ensureSearch(): void {
    if(this.searchReady)return;
    const cache=new Map<string,string>(),normal=(value:string)=>{let result=cache.get(value);if(result===undefined){result=normalizeSearch(value);cache.set(value,result);}return result;};
    for(const source of sources)for(const [alias,glyphs]of Object.entries(this.data.shortcodes[source])){
      const value=normal(alias);
      for(const glyph of glyphs)if(this.byGlyph.has(glyph)){
        if(!this.sourceAliases.has(glyph))this.sourceAliases.set(glyph,new Set());
        this.sourceAliases.get(glyph)!.add(value);
      }
    }
    const localizedKeywords=new Set(this.data.search?.localized_keywords??[]);
    for (const row of this.data.emojis) {
      const native=this.data.search?.native[row.emoji];
      const names=[...new Set([row.name,native?.name].filter((name):name is string=>typeof name==='string').map(normal))];
      const primaryShorts=[...new Set(row.shortcodes.map(normal))];
      const shorts=[...new Set([...primaryShorts,...(this.sourceAliases.get(row.emoji)??[])])];
      const keywords=[...new Set([...(row.deep?.keywords??[]),...(native?.keywords??[])].map(normal))];
      const allNames=[...names,...shorts];
      this.searchFacts.set(row.emoji,{names,primaryShorts,shorts,keywords,translatedKeywords:this.data.localization?.resolved_locale&&localizedKeywords.has(row.emoji)?(row.deep?.keywords??[]).map(normal):[],allNames,blob:[...new Set([...allNames,...keywords])].join(' ')});
    }
    this.sourceAliases.clear();
    this.searchReady=true;
  }

  private encoding(source:typeof sources[number]): Map<string,string> {
    let map=this.encodings.get(source);
    if(!map){map=new Map();for(const [alias,glyphs]of Object.entries(this.data.shortcodes[source]))if(glyphs.length===1&&this.byGlyph.has(glyphs[0]!)&&!map.has(glyphs[0]!))map.set(glyphs[0]!,`:${stripColons(alias)}:`);this.encodings.set(source,map);}
    return map;
  }

  /** Evidence for the full server inventory; scope() identifies this downloaded subset. */
  metadata(): EmojiMetadata { return structuredClone(this.data.metadata); }

  /** Filters, local record count and whether this download contains the full server inventory. */
  scope(): EmojiCatalogScope {
    return structuredClone({...this.data.scope,filters:this.data.scope?.filters ?? {},total:this.data.total,complete_inventory:this.data.scope?.complete_inventory ?? this.data.total===this.data.metadata.total});
  }

  lookup(input: string, options: EmojiCatalogLookupOptions = {}): Emoji {
    if (typeof input !== 'string' || !input.trim() || input.trim().length > 512) invalid('Emoji input must contain 1–512 characters.');
    const value = input.trim(), source = options.shortcodeSource;
    if (source && !sources.includes(source as typeof sources[number])) invalid('shortcodeSource must be cldr, github, slack or discord.');
    let glyph = this.byGlyph.has(value) ? value : undefined;
    if (!glyph && !source && Object.hasOwn(this.data.legacy, legacyName(value))) glyph = this.data.legacy[legacyName(value)];
    if (!glyph) {
      let form = value;
      if (/^(?:U\+)?[0-9A-F]{4,6}(?:[\s,-]+(?:U\+)?[0-9A-F]{4,6})*$/i.test(value)) {
        const points = value.split(/[\s,-]+/).map(part => Number.parseInt(part.replace(/^U\+/i, ''), 16));
        if (points.length > 32 || points.some(cp => cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF))) invalid('Unicode codepoints must be valid scalar values.');
        form = String.fromCodePoint(...points);
      } else if (/^U\+/i.test(value)) invalid('Use Unicode codepoints such as U+1F680 or U+2764 U+FE0F.');
      const canonical = Object.hasOwn(this.data.forms, form) ? this.data.forms[form] : form;
      if (canonical && this.byGlyph.has(canonical)) glyph = canonical;
    }
    if (!glyph) {
      const candidates = new Set<string>();
      for (const key of new Set([stripColons(value).toLowerCase(), normalizeName(value)])) {
        for (const name of source ? [source] : sources) {
          const dictionary = this.data.shortcodes[name as typeof sources[number]];
          if (Object.hasOwn(dictionary, key)) for (const candidate of dictionary[key] ?? []) if (this.byGlyph.has(candidate)) candidates.add(candidate);
        }
      }
      if (!source) for (const candidate of this.aliases.get(normalizeName(value)) ?? []) candidates.add(candidate);
      if (!source || (!candidates.size && !/^:.*:$/.test(value))) for (const candidate of this.names.get(normalizeName(value)) ?? []) candidates.add(candidate);
      if (candidates.size > 1) invalid('Emoji shortcode is ambiguous. Set shortcodeSource to cldr, github, slack or discord.');
      glyph = candidates.values().next().value;
    }
    const row = glyph ? this.byGlyph.get(glyph) : undefined;
    if (!row) throw new EmojiCatalogError('not_found', 'Emoji not found in this downloaded catalog.');
    return this.project(row, options.deep === true);
  }

  search(query: string, options: EmojiCatalogSearchOptions = {}): EmojiSearch {
    if (typeof query !== 'string' || !query.trim() || query.trim().length > 256) invalid('Search query must contain 1–256 characters.');
    return this.page(query.trim(), options);
  }

  browse(options: EmojiCatalogSearchOptions = {}): EmojiBrowse { const {q,...result}=this.page('', options);return result as EmojiBrowse; }

  /** Unknown and ambiguous inputs remain literal; positions refer to untouched input. */
  convert(text: string, options: EmojiCatalogConvertOptions): EmojiConversion {
    if(!options||!['to_shortcodes','to_emoji'].includes(options.direction))invalid('Direction must be to_shortcodes or to_emoji.');
    if(!sources.includes(options.shortcodeSource))invalid('shortcodeSource must be cldr, github, slack or discord.');
    const parsed=this.parse(text),replacements:Array<{emoji:string;shortcode:string;start:number;end:number}>=[],unresolved:EmojiConversion['unresolved']=[];
    if(options.direction==='to_shortcodes'){
      const encodings=this.encoding(options.shortcodeSource);
      for(const row of parsed.emojis){const shortcode=encodings.get(row.emoji);
        for(const position of row.positions)if(shortcode)replacements.push({emoji:row.emoji,shortcode,...position});else unresolved.push({emoji:row.emoji,...position,reason:'unavailable'});
      }
    }else for(const match of text.matchAll(/:[^:\s]{1,128}:/gu)){
      const shortcode=match[0],start=match.index,end=start+shortcode.length;
      try{const row=this.lookup(shortcode,{shortcodeSource:options.shortcodeSource});replacements.push({emoji:row.emoji,shortcode,start,end});}
      catch(error){if(!(error instanceof EmojiCatalogError))throw error;unresolved.push({shortcode,start,end,reason:error.code==='not_found'?'unknown':'ambiguous'});}
    }
    replacements.sort((a,b)=>a.start-b.start);unresolved.sort((a,b)=>a.start-b.start);
    let cursor=0;const chunks:string[]=[];
    for(const row of replacements){chunks.push(text.slice(cursor,row.start),options.direction==='to_shortcodes'?row.shortcode:row.emoji);cursor=row.end;}
    chunks.push(text.slice(cursor));return{text:chunks.join(''),unresolved};
  }

  /** Whole-grapheme predicate. Use parse() to extract emoji from prose with positions. */
  regex(options: EmojiCatalogRegexOptions = {}): RegExp {
    const forms=options.qualifiedOnly?[...this.byGlyph.keys()]:Object.keys(this.data.forms).filter(form=>this.byGlyph.has(this.data.forms[form]!));
    if(options.components)forms.push(...['🏻','🏼','🏽','🏾','🏿','🦰','🦱','🦲','🦳']);
    const escaped=[...new Set(forms)].sort((a,b)=>b.length-a.length||(a<b?-1:1)).map(form=>form.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    return new RegExp(`^(?:${escaped.length?escaped.join('|'):'(?!)'})$`,'u');
  }

  categories(): EmojiCategories {
    const groups = new Map<string, Set<string>>();
    for (const row of this.data.emojis) {
      if (!row.category) continue;
      if (!groups.has(row.category)) groups.set(row.category, new Set());
      if (row.deep?.subcategory) groups.get(row.category)!.add(row.deep.subcategory);
    }
    return { categories: [...groups].map(([category, subcategories]) => ({ category, subcategories: [...subcategories] })) };
  }

  parse(text: string, options: EmojiCatalogParseOptions = {}): EmojiParse {
    if (typeof text !== 'string' || text.length > 16000) invalid('Text must be a string of at most 16000 UTF-16 code units.');
    const found = new Map<string, EmojiParse['emojis'][number]>();
    this.segmenter??=new Intl.Segmenter('en',{granularity:'grapheme'});
    for (const { segment, index } of this.segmenter.segment(text)) {
      const canonical = Object.hasOwn(this.data.forms, segment) ? this.data.forms[segment] : segment;
      const row = canonical ? this.byGlyph.get(canonical) : undefined;
      if (!row) continue;
      if (!found.has(row.emoji)) found.set(row.emoji, { ...this.project(row, options.deep === true), positions: [] });
      const result = found.get(row.emoji)!;
      result.positions.push({ start: index, end: index + segment.length });
    }
    return { emojis: [...found.values()] };
  }

  private project(row: Emoji, deep: boolean): Emoji {
    const { emoji, name, shortcodes, category } = row;
    return { emoji, name, shortcodes:[...shortcodes], category, ...(deep ? { deep: structuredClone(row.deep) } : {}) };
  }

  private page(query: string, options: EmojiCatalogSearchOptions): EmojiSearch {
    if (options.limit !== undefined && (!Number.isSafeInteger(options.limit) || options.limit < 1)) invalid('Limit must be a positive integer.');
    const limit = Math.min(options.limit ?? 20, 50), offset = options.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) invalid('Offset must be an integer between 0 and 100000.');
    for (const [key, known] of [['category', this.categoryKeys], ['subcategory', this.subcategoryKeys]] as const) {
      if (options[key] !== undefined && (!options[key]!.trim() || !known.has(filterKey(options[key]!)))) invalid(`Unknown emoji ${key}. Use categories() to find supported values.`);
    }
    for (const key of ['version', 'maxVersion'] as const) if (options[key] !== undefined && (!/^\d{1,2}\.\d{1,2}$/.test(options[key]!) || versionCompare(options[key]!, this.data.metadata.source_version) > 0)) invalid(`${key} must be an Emoji version no newer than ${this.data.metadata.source_version}.`);
    let rows = this.filtered(options);
    if (query) {
      this.ensureSearch();
      const needle = normalizeSearch(query), words = needle.split('_').filter(Boolean);
      const scored = rows.flatMap(row => {
        const {names,primaryShorts,shorts,keywords,translatedKeywords,allNames,blob}=this.searchFacts.get(row.emoji)!;
        if (!blob.includes(needle) && !(words.length > 1 && words.every(word => blob.includes(word)))) return [];
        const score = primaryShorts.includes(needle) || names.includes(needle) ? 0
          : shorts.includes(needle) ? 0.5
          : allNames.some(value => value.startsWith(needle)) ? 1
          : translatedKeywords.includes(needle) ? 1.5
          : allNames.some(value => value.includes(needle)) ? 2
          : words.length > 1 && allNames.some(value => words.every(word => value.includes(word))) ? 2.5
          : keywords.some(value => value.includes(needle)) ? 3
          : words.length > 1 && words.every(word => blob.includes(word)) ? 4 : 100;
        return score === 100 ? [] : [{ row, score }];
      });
      rows = scored.sort((a,b) => a.score - b.score || (this.data.localization?.resolved_locale
        ? this.compareNames(a.row.name, b.row.name) || a.row.emoji.localeCompare(b.row.emoji)
        : a.row.name.localeCompare(b.row.name))).map(({ row }) => row);
    }
    const page = rows.slice(offset, offset + limit), paged = !query || ['category', 'subcategory', 'version', 'maxVersion', 'includeSkinTones', 'offset'].some(key => options[key as keyof EmojiCatalogSearchOptions] !== undefined);
    return { q: query, emojis: page.map(row => this.project(row, options.deep === true)), ...(paged ? { total: rows.length, next_offset: offset + page.length < rows.length ? offset + page.length : null } : {}) };
  }

  private filtered(options: EmojiCatalogSearchOptions): Emoji[] {
    for (const [key, known] of [['category', this.categoryKeys], ['subcategory', this.subcategoryKeys]] as const) {
      if (options[key] !== undefined && (!options[key]!.trim() || !known.has(filterKey(options[key]!)))) invalid(`Unknown emoji ${key}. Use categories() to find supported values.`);
    }
    for (const key of ['version', 'maxVersion'] as const) if (options[key] !== undefined && (!/^\d{1,2}\.\d{1,2}$/.test(options[key]!) || versionCompare(options[key]!, this.data.metadata.source_version) > 0)) invalid(`${key} must be an Emoji version no newer than ${this.data.metadata.source_version}.`);
    if(options.includeSkinTones!==false&&options.category===undefined&&options.subcategory===undefined&&options.version===undefined&&options.maxVersion===undefined)return this.data.emojis;
    const key=JSON.stringify([options.includeSkinTones===false,options.category===undefined?null:filterKey(options.category),options.subcategory===undefined?null:filterKey(options.subcategory),options.version,options.maxVersion]);
    const cached=this.filterCache.get(key);if(cached)return cached;
    const rows=this.data.emojis.filter(row =>
      (options.includeSkinTones !== false || !/[\u{1F3FB}-\u{1F3FF}]/u.test(row.emoji))
      && (options.category === undefined || filterKey(row.category ?? '') === filterKey(options.category))
      && (options.subcategory === undefined || filterKey(row.deep?.subcategory ?? '') === filterKey(options.subcategory))
      && (options.version === undefined || versionCompare(row.deep!.version!, options.version) === 0)
      && (options.maxVersion === undefined || versionCompare(row.deep!.version!, options.maxVersion) <= 0));
    if(this.filterCache.size>=32)this.filterCache.delete(this.filterCache.keys().next().value!);
    this.filterCache.set(key,rows);return rows;
  }
}
