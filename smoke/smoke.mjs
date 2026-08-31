/**
 * Live smoke against the edge. Canary-ready: env-driven, clean exit codes.
 *   PARSEAPI_KEY       required
 *   PARSEAPI_BASE_URL  optional override
 * Run: node smoke/smoke.mjs (after npm run build)
 */
import { parseAPI, ParseAPIError } from '../dist/index.js';

const checks = [];
let failures = 0;

function check(name, ok, detail = '') {
	checks.push({ name, ok, detail });
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
}

const parse = parseAPI();

async function expectOk(name, promise, assert) {
	try {
		const result = await promise;
		const problem = assert ? assert(result) : null;
		check(name, !problem, problem ?? '');
	} catch (err) {
		check(name, false, err instanceof ParseAPIError ? `${err.status} ${err.code}` : String(err));
	}
}

async function expectError(name, promise, code) {
	try {
		await promise;
		check(name, false, 'expected error, got 200');
	} catch (err) {
		if (err instanceof ParseAPIError) {
			check(name, err.code === code, `got ${err.code}`);
		} else {
			check(name, false, String(err));
		}
	}
}

await expectOk('ip', parse.ip('8.8.8.8'), (r) => (r.ip === '8.8.8.8' ? null : 'wrong ip'));
await expectOk('ip.self', parse.ip.self(), (r) => (r.ip ? null : 'no ip'));
await expectOk('continent', parse.continent('NA'), (r) => (r.name === 'North America' ? null : 'wrong name'));
await expectOk('continent.countries', parse.continent.countries('NA'), (r) =>
	Array.isArray(r.countries) && r.countries.length > 0 ? null : 'no countries'
);
await expectOk('bloc', parse.bloc('EU'), (r) =>
	r.name === 'European Union' && r.members === 27 ? null : 'wrong bloc'
);
await expectOk('bloc.countries', parse.bloc.countries('SCHENGEN'), (r) =>
	Array.isArray(r.countries) && r.countries.length === 29 ? null : 'wrong members'
);
await expectOk('country', parse.country('US'), (r) => (r.iso3 === 'USA' ? null : 'wrong iso3'));
await expectOk('country.states', parse.country.states('US'), (r) => (r.states.length >= 50 ? null : 'too few states'));
await expectOk('state', parse.state('NC', { country: 'US' }), (r) => (r.name === 'North Carolina' ? null : 'wrong name'));
await expectOk('state.districts', parse.state.districts('NC', { country: 'US' }), (r) =>
	r.districts.length > 0 ? null : 'no districts'
);
await expectOk('district', parse.district('37081'), (r) => (r.name?.includes('Guilford') ? null : 'wrong district'));
{
	let cityId = null;
	await expectOk('city', parse.city('charlotte', { country: 'US' }), (r) => {
		if (r.name !== 'Charlotte') return 'wrong city';
		if (typeof r.id !== 'string' || !r.id.startsWith('city_')) return 'missing id';
		cityId = r.id;
		return null;
	});
	if (cityId) {
		await expectOk('city.id', parse.city.id(cityId), (r) =>
			r.id === cityId && r.name === 'Charlotte' ? null : 'id mismatch'
		);
	} else {
		check('city.id', false, 'skipped, no id from city');
	}
}
await expectOk('city.search', parse.city.search('char', { country: 'US', limit: 5 }), (r) =>
	r.cities.length > 0 ? null : 'no results'
);
await expectOk('city.nearest', parse.city.nearest(35.2271, -80.8431), (r) =>
	typeof r.distance === 'number' ? null : 'no distance'
);
await expectOk('postal', parse.postal('28202', { country: 'US' }), (r) => (r.city === 'Charlotte' ? null : 'wrong city'));
await expectOk('postal.nearby', parse.postal.nearby('28202', { country: 'US', radius: 40 }), (r) =>
	r.nearby.length > 0 ? null : 'no nearby'
);
await expectOk('postal.distance', parse.postal.distance('28202', '10001', { country: 'US' }), (r) =>
	r.distance > 800 && r.distance < 1000 ? null : `distance ${r.distance}`
);
await expectOk('email', parse.email('hello@gmail.com'), (r) => (r.valid === true ? null : 'not valid'));
await expectOk('vat', parse.vat('DE136695976'), (r) => (r.valid === true && r.country === 'DE' ? null : 'not valid DE'));
await expectOk('iban', parse.iban('DE89370400440532013000'), (r) =>
	r.valid === true && r.country === 'DE' && r.bank === '37040044' ? null : 'not valid DE'
);
await expectOk('iban junk', parse.iban('hello'), (r) => (r.valid === false ? null : 'expected invalid'));
await expectOk('phone', parse.phone('+14155552671'), (r) => (r.phone === '+14155552671' ? null : 'wrong phone'));
// Metered core siblings: junk numbers answer 200 valid false, free, no vendor dip.
await expectOk('carrier junk free', parse.carrier('555-0100'), (r) => (r.valid === false ? null : 'expected invalid'));
await expectOk('caller junk free', parse.caller('555-0100'), (r) => (r.valid === false ? null : 'expected invalid'));
await expectOk('hlr junk free', parse.hlr('555-0100'), (r) => (r.valid === false ? null : 'expected invalid'));
await expectOk('domain', parse.domain('gmail.com'), (r) => (r.available === false ? null : 'gmail available?'));
await expectOk('mx', parse.mx('gmail.com'), (r) => (r.mx.length > 0 ? null : 'no mx'));
await expectOk('useragent', parse.useragent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'), (r) =>
	r.browser === 'Chrome' ? null : `browser ${r.browser}`
);
await expectOk('vin', parse.vin('1HGCM82633A004352'), (r) =>
	r.valid === true && r.make === 'Honda' && r.year === 2003 ? null : `vin ${r.make} ${r.year}`
);
await expectOk('vin junk', parse.vin('1HGCM82613A004352'), (r) => (r.valid === false ? null : 'expected invalid'));
await expectOk('currency', parse.currency('USD'), (r) => (r.symbol === '$' ? null : 'wrong symbol'));
await expectOk('currency.rate', parse.currency.rate('USD', 'EUR'), (r) =>
	r.rate > 0 && r.rate < 10 ? null : `rate ${r.rate}`
);
await expectOk('language', parse.language('en'), (r) =>
	r.language === 'en' && r.name === 'English' ? null : 'wrong language'
);
await expectOk('name', parse.name("BILLY O'SHALL"), (r) =>
	r.name === "Billy O'Shall" && r.valid === true && r.gender === 'male' ? null : 'wrong name'
);
await expectOk('timezone', parse.timezone('America/New_York'), (r) =>
	r.offset_minutes === -240 || r.offset_minutes === -300 ? null : `offset ${r.offset_minutes}`
);
await expectOk('holiday', parse.holiday('US'), (r) => (r.holidays.length > 5 ? null : 'too few holidays'));
await expectOk('holiday.date', parse.holiday.date('US', '2026-12-25'), (r) =>
	r.holiday?.name === 'Christmas Day' ? null : 'not christmas'
);
await expectOk('holiday null (not a holiday)', parse.holiday.date('US', '2026-08-12'), (r) =>
	r.holiday === null ? null : 'expected null'
);
await expectOk('elevation', parse.elevation(35.2271, -80.8431), (r) =>
	typeof r.elevation === 'number' ? null : 'no elevation'
);
await expectOk('point', parse.point(36.0726, -79.792), (r) => (r.country === 'US' ? null : `country ${r.country}`));
await expectOk('weather', parse.weather(40.7128, -74.006), (r) => (r.station?.id ? null : 'no station'));
await expectOk('emoji', parse.emoji('rocket'), (r) => (r.emoji === '\u{1F680}' ? null : 'wrong emoji'));
await expectOk('emoji.search', parse.emoji.search('fire', { limit: 5 }), (r) =>
	r.emojis.length > 0 ? null : 'no results'
);

// Deep triad: asked on a free-deep endpoint always yields an object.
await expectOk('point deep triad', parse.point(36.0726, -79.792, { deep: true }), (r) =>
	r.deep && typeof r.deep === 'object' ? null : 'deep missing'
);

// Honest 404 and auth errors.
await expectError('honest 404', parse.city('notarealcityxyz'), 'not_found');
await expectError('bogus key 401', parseAPI('bogus_key_123', { retries: 0 }).country('US'), 'invalid_api_key');

console.log(`\n${checks.length - failures}/${checks.length} passed`);
process.exit(failures === 0 ? 0 : 1);
