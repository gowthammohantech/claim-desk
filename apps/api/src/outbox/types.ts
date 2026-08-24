import type { OutboxEventType } from '@claimdesk/contracts';

/**
 * A domain event written in the SAME transaction as the business mutation
 * (ADR-009). The worker drains these and turns them into jobs, which is how
 * ClaimDesk gets reliable async delivery without Redis or BullMQ (ADR-004).
 */
export interface OutboxEvent<TPayload = unknown> {
  id: string;
  type: OutboxEventType;
  payload: TPayload;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  occurredAt: Date;
  dispatchedAt?: Date | undefined;
  attempts: number;
}

export type OutboxEventInput<TPayload = unknown> = Omit<
  OutboxEvent,
  'id' | 'dispatchedAt' | 'attempts' | 'occurredAt'
> & { payload: TPayload; occurredAt?: Date };
