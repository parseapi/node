/** A proposed task contains operation counts, never lookup inputs. */
export interface PreflightOperation {
	operation: 'email' | 'domain' | 'dns' | 'mx' | 'country';
	/** Positive integer, at most 100000. */
	count: number;
	deep?: boolean;
}

export interface PreflightTask {
	/** One to twenty rows, totaling at most 100000 lookups. */
	operations: PreflightOperation[];
	/** Nonnegative USD decimal string with at most two fractional digits. Advisory, never an enforced cap. */
	budget_usd?: string;
}

export interface PreflightOperationEstimate {
	operation: string;
	count: number;
	deep: boolean;
	permitted: boolean;
	reason: string | null;
	/** Attempts per lookup under the default SDK retry policy. */
	max_http_attempts: number;
	pooled_requests_max: number;
	metered_units_max: number;
}

export interface PreflightCost {
	currency: string;
	status: string;
	minimum_usd: string;
	/** Additional charges assuming included units are exhausted. Null when the effective rate is unknown. */
	maximum_usd: string | null;
	/** Additional charges using currently unallocated included units. */
	projected_maximum_usd: string | null;
	on_demand_unit_price_usd: string | null;
}

export interface PreflightPooledCapacity {
	advisory: true;
	required_max: number;
	policy: string | null;
	limit: number | null;
	used_at_snapshot: number | null;
	remaining_at_snapshot: number | null;
	/** Unix seconds, or null when no active grace deadline is known. */
	grace_until: number | null;
	/** Unix seconds. */
	reset_at: number;
	allowed_at_snapshot: boolean | null;
	status: string;
}

export interface PreflightEmailCapacity {
	advisory: true;
	required_max: number;
	included_limit: number;
	reserved_at_snapshot: number | null;
	unallocated_included_at_snapshot: number | null;
	projected_overage_units_max: number | null;
	on_demand_enabled: boolean | null;
	fits_unallocated_capacity: boolean | null;
	/** Unix seconds. */
	reset_at: number;
}

export interface PreflightSpendCapacity {
	advisory: true;
	currency: string;
	cap_usd: string | null;
	cap_status: string;
	reserved_usd_at_snapshot: string | null;
	unallocated_usd_at_snapshot: string | null;
	/** Unix seconds. */
	reset_at: number;
}

/** A credential-specific estimate. Counters are advisory and can change during execution. */
export interface Preflight {
	schema_version: string;
	api_version: string;
	/** ISO 8601 evaluation time. */
	evaluated_at: string;
	estimate_only: true;
	supported: boolean;
	/** Permission for the requested features, separate from available capacity. */
	permitted: boolean;
	operations: PreflightOperationEstimate[];
	cost: PreflightCost;
	capacity: {
		pooled_requests: PreflightPooledCapacity;
		email_verifications: PreflightEmailCapacity;
		shared_on_demand_spend: PreflightSpendCapacity;
	};
	budget?: { amount_usd: string; within_maximum: boolean | null; enforced: false };
	assumptions: string[];
	warnings: string[];
}
