import { ulid } from 'ulid';

/**
 * ULIDs rather than UUIDv4 for ids we generate ourselves: they sort
 * lexicographically by creation time, which keeps Mongo index locality good on
 * high-write collections like `auditEvents`, `outbox` and `jobs`.
 */
export const newId = (): string => ulid();

export const newRequestId = (): string => ulid();

export const newCorrelationId = (): string => ulid();
