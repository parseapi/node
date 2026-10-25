import type { CityAmbiguityCandidate } from './types.js';

/** Every non-2xx response from the API. Branch on `code`, never on `message`. */
export class ParseAPIError extends Error {
	/** HTTP status */
	readonly status: number;
	/** Machine-readable error code, e.g. 'not_found', 'invalid_api_key', 'rate_limited' */
	readonly code: string;
	/** Link to the docs section for this error */
	readonly docs: string | null;
	/** Send this if you contact support */
	readonly requestId: string | null;
	/** Original Retry-After response header, when supplied. */
	readonly retryAfter: string | null;

	declare candidates?: CityAmbiguityCandidate[];

	constructor(status: number, code: string, message: string, docs: string | null = null, requestId: string | null = null, retryAfter: string | null = null) {
		super(message);
		this.name = 'ParseAPIError';
		this.status = status;
		this.code = code;
		this.docs = docs;
		this.requestId = requestId;
		this.retryAfter = retryAfter;
	}
}
