# Pending npm name

This unpublished scaffold reserves the proposed `parseapi` package layout while npm reviews the name request. The supported package is [@parseapi/sdk](https://www.npmjs.com/package/@parseapi/sdk).

```bash
npm install @parseapi/sdk
```

```ts
import { parseAPI } from '@parseapi/sdk';

const parse = parseAPI('your-api-key');
const country = await parse.country('US');
```

Publication and any package-name change wait for the npm name grant. Existing `@parseapi/sdk` installs retain their supported entry point.
