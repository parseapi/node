import type { PreflightOperation } from './preflight.js';

/** Additional-charge budget enforced only for lookups run through this task. */
export interface AgentTaskInput {
	operations: PreflightOperation[];
	budget_usd: string;
}
export interface AgentTaskLookupInput {
	operation: PreflightOperation['operation'];
	value: string;
	deep?: boolean;
	country?: string;
}
export interface AgentTask {
	id: string;
	status: string;
	api_version: string;
	created_at: string;
	expires_at: string;
	result_expires_at: string;
	budget: { currency: string; enforced: true; maximum_usd: string; spent_usd: string; reserved_usd: string; remaining_usd: string };
	operations: { operation: string; deep: boolean; count: number; allocated: number; completed: number; remaining: number }[];
}
/** Inspect status_code and result. Saved errors also replay without new usage. */
export interface AgentTaskResult<T = unknown> {
	status_code: number;
	result: T;
	receipt: { task_id: string; request_id: string; operation: string; deep: boolean;
		metered_unit: boolean; additional_cost_usd: string; checked_at: string; api_version: string; retry_after?: string };
}
