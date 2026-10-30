import type { Deep, Stack } from './types.js';

/** Registration detail from the same observation. Missing or null means unknown. */
export interface DomainRegistrationResult {
	registered?: boolean | null;
	created?: string | null;
	updated?: string | null;
	expires?: string | null;
	registrar?: string | null;
	status?: string[] | null;
	dnssec?: boolean | null;
}

export interface DomainResultDeep {
	registration: DomainRegistrationResult | null;
}

/** Domain availability with an explicit unknown result. */
export interface DomainResult {
	domain: string;
	/** true means unregistered, false means registered, null means unknown. */
	available: boolean | null;
	deep?: Deep<DomainResultDeep>;
}

/** The current eleven-field Stack response, without obsolete coverage members. */
export type StackResult = Omit<Stack, 'scope' | 'pages' | 'partial'>;
