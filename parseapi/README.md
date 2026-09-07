# parseapi

Official ParseAPI client for Node and TypeScript.

```bash
npm install parseapi
```

```ts
import { parseAPI } from 'parseapi';

const parse = parseAPI('your-api-key');
const country = await parse.country('US');
```

This is the same client as [@parseapi/sdk](https://www.npmjs.com/package/@parseapi/sdk) under its short name. Same exports, same types, same versions.

Get a key at [parseapi.com](https://parseapi.com). Full docs at [parseapi.com/docs](https://parseapi.com/docs).
