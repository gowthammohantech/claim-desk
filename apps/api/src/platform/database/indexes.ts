/**
 * Every index in the system, in one reviewable table.
 *
 * Centralised rather than declared per-model for two reasons:
 *
 *  1. The migration runner lives in `platform/`, which is lint-banned from
 *     importing any module — so it could not gather per-module declarations.
 *  2. It mirrors design/04-data-model.md §4 line for line, which makes drift
 *     between spec and database a diff rather than an archaeology exercise.
 *
 * The trade-off is real: a module's indexes are declared away from its model.
 * That is worth it here.
 *
 * Applied ONLY by the migration runner (`ROLE=migrate`). `autoIndex` and
 * `autoCreate` are disabled in `mongo.ts` so nothing builds an index as a side
 * effect of a query — requirements/TDD.md §29.
 *
 * Never use `syncIndexes()`: it DROPS indexes absent from the schema, which
 * during a rolling deploy removes indexes the still-running old pods depend on.
 * That is the opposite of expand/migrate/contract.
 */

/**
 * Declared locally rather than importing `IndexDescription` from `mongodb`:
 * mongodb is a transitive dependency of mongoose, not a direct one, and
 * `import-x/no-extraneous-dependencies` rightly rejects reaching into it.
 * The driver accepts plain objects of this shape.
 */
export interface IndexSpec {
  key: Record<string, 1 | -1 | 'text'>;
  name: string;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
}

export interface CollectionIndexSpec {
  collection: string;
  indexes: IndexSpec[];
}

export const INDEX_SPECS: readonly CollectionIndexSpec[] = [
  // ─── design/04 §4, verbatim ───────────────────────────────────────────────
  {
    collection: 'employees',
    indexes: [
      { key: { employeeCode: 1 }, name: 'uq_employeeCode', unique: true },
      // Mobile number is the login identity — "Mobile number maps to one active
      // employee" (design/11 §2). Unique in the DBML, not in §4.
      { key: { mobileNumber: 1 }, name: 'uq_mobileNumber', unique: true },
      // §4 says "unique normalized email". email is optional, so the index must
      // be partial or a second employee without an email collides on null.
      // A stored `emailNormalized` beats a collation index: easier to reason
      // about, and testable without collation subtleties.
      {
        key: { emailNormalized: 1 },
        name: 'uq_emailNormalized',
        unique: true,
        partialFilterExpression: { emailNormalized: { $type: 'string' } },
      },
      { key: { managerEmployeeId: 1 }, name: 'ix_manager' },
    ],
  },
  {
    collection: 'expenses',
    indexes: [
      { key: { expenseNo: 1 }, name: 'uq_expenseNo', unique: true },
      { key: { employeeId: 1, state: 1, expenseDate: -1 }, name: 'ix_employee_state_date' },
      { key: { claimId: 1 }, name: 'ix_claim' },
    ],
  },
  {
    collection: 'claims',
    indexes: [
      { key: { claimNo: 1 }, name: 'uq_claimNo', unique: true },
      { key: { employeeId: 1, status: 1, submittedAt: -1 }, name: 'ix_employee_status_submitted' },
      { key: { status: 1, submittedAt: -1 }, name: 'ix_status_submitted' },
    ],
  },
  {
    collection: 'approvalTasks',
    indexes: [
      { key: { assignedApproverId: 1, status: 1, dueAt: 1 }, name: 'ix_approver_status_due' },
      // §4 hedges with "where applicable"; a partial unique index is that hedge
      // made concrete, and it is the backstop against double-creating a stage.
      {
        key: { claimId: 1, stageIndex: 1, assignedApproverId: 1 },
        name: 'uq_claim_stage_approver',
        unique: true,
        partialFilterExpression: { assignedApproverId: { $type: 'objectId' } },
      },
      { key: { claimId: 1, status: 1 }, name: 'ix_claim_status' },
    ],
  },
  {
    collection: 'policyDefinitions',
    indexes: [
      {
        key: { status: 1, effectiveFrom: -1, effectiveTo: 1, priority: -1 },
        name: 'ix_effective',
      },
      { key: { policyCode: 1, version: -1 }, name: 'uq_policyCode_version', unique: true },
    ],
  },
  {
    collection: 'workflowDefinitions',
    indexes: [
      {
        key: { status: 1, effectiveFrom: -1, effectiveTo: 1, priority: -1 },
        name: 'ix_effective',
      },
      { key: { workflowCode: 1, version: -1 }, name: 'uq_workflowCode_version', unique: true },
    ],
  },
  {
    collection: 'auditEvents',
    indexes: [
      { key: { eventId: 1 }, name: 'uq_eventId', unique: true },
      { key: { entityType: 1, entityId: 1, occurredAt: -1 }, name: 'ix_entity_time' },
      { key: { 'actor.employeeId': 1, occurredAt: -1 }, name: 'ix_actor_time' },
    ],
  },
  {
    collection: 'outbox',
    indexes: [
      { key: { status: 1, availableAt: 1, lockedAt: 1 }, name: 'ix_lease' },
      { key: { aggregateType: 1, aggregateId: 1 }, name: 'ix_aggregate' },
    ],
  },

  // ─── DBML uniques not restated in §4 ──────────────────────────────────────
  { collection: 'clients', indexes: [{ key: { code: 1 }, name: 'uq_code', unique: true }] },
  {
    collection: 'engagements',
    indexes: [
      { key: { code: 1 }, name: 'uq_code', unique: true },
      { key: { clientId: 1, status: 1 }, name: 'ix_client_status' },
      // Drives GET /me/engagements: open engagements this employee is on.
      { key: { memberEmployeeIds: 1, status: 1 }, name: 'ix_member_status' },
    ],
  },
  {
    collection: 'expenseCategories',
    indexes: [{ key: { code: 1 }, name: 'uq_code', unique: true }],
  },
  { collection: 'roles', indexes: [{ key: { code: 1 }, name: 'uq_code', unique: true }] },
  {
    collection: 'paymentBatches',
    indexes: [{ key: { batchNo: 1 }, name: 'uq_batchNo', unique: true }],
  },
  {
    collection: 'payments',
    indexes: [
      // design/04 §3: "Claim 0:1 Payment".
      { key: { claimId: 1 }, name: 'uq_claim', unique: true },
      { key: { paymentBatchId: 1 }, name: 'ix_batch' },
    ],
  },
  {
    collection: 'financeReviews',
    // design/04 §3: "Claim 0:1 FinanceReview". §4 states no index; without this
    // a claim could acquire two reviews.
    indexes: [{ key: { claimId: 1 }, name: 'uq_claim', unique: true }],
  },
  {
    collection: 'receipts',
    indexes: [
      { key: { expenseId: 1 }, name: 'ix_expense' },
      // §4's "receipt hash support" for duplicate detection, made concrete.
      { key: { sha256: 1 }, name: 'ix_sha256' },
    ],
  },
  { collection: 'ocrResults', indexes: [{ key: { receiptId: 1 }, name: 'ix_receipt' }] },
  {
    collection: 'policyEvaluations',
    indexes: [{ key: { expenseId: 1, evaluatedAt: -1 }, name: 'ix_expense_time' }],
  },
  {
    collection: 'duplicateCases',
    indexes: [
      { key: { expenseId: 1, status: 1 }, name: 'ix_expense_status' },
      { key: { expenseId: 1, candidateExpenseId: 1 }, name: 'uq_pair', unique: true },
    ],
  },
  {
    collection: 'notifications',
    indexes: [{ key: { recipientEmployeeId: 1, readAt: 1, createdAt: -1 }, name: 'ix_inbox' }],
  },
  {
    collection: 'integrationRuns',
    indexes: [{ key: { integration: 1, startedAt: -1 }, name: 'ix_integration_time' }],
  },

  // ─── Collections added by this implementation (not in design/04) ──────────
  {
    collection: 'jobs',
    indexes: [
      { key: { status: 1, availableAt: 1 }, name: 'ix_lease' },
      { key: { status: 1, lastHeartbeatAt: 1 }, name: 'ix_reaper' },
      { key: { type: 1, status: 1 }, name: 'ix_type_status' },
      // Makes outbox -> job dispatch exactly-once even across two workers.
      {
        key: { idempotencyKey: 1 },
        name: 'uq_idempotencyKey',
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } },
      },
      { key: { expiresAt: 1 }, name: 'ttl_completed', expireAfterSeconds: 0 },
    ],
  },
  {
    collection: 'refreshTokens',
    indexes: [
      { key: { tokenHash: 1 }, name: 'uq_tokenHash', unique: true },
      { key: { employeeId: 1, revokedAt: 1 }, name: 'ix_employee' },
      { key: { expiresAt: 1 }, name: 'ttl_expired', expireAfterSeconds: 0 },
    ],
  },
  {
    collection: 'idempotencyKeys',
    indexes: [
      // Scoped by employee as well as operation: without employeeId, a guessed
      // key would replay another user's stored response body.
      {
        key: { employeeId: 1, operationId: 1, key: 1 },
        name: 'uq_actor_operation_key',
        unique: true,
      },
      { key: { expiresAt: 1 }, name: 'ttl_expired', expireAfterSeconds: 0 },
    ],
  },
  {
    collection: 'otpChallenges',
    indexes: [
      { key: { mobileNumber: 1 }, name: 'ix_mobile' },
      { key: { expiresAt: 1 }, name: 'ttl_expired', expireAfterSeconds: 0 },
    ],
  },
  {
    collection: '_migrations',
    indexes: [{ key: { migrationId: 1 }, name: 'uq_migrationId', unique: true }],
  },
];

/** Total index count, for the migration runner's log line and its test. */
export const TOTAL_INDEX_COUNT = INDEX_SPECS.reduce(
  (total, spec) => total + spec.indexes.length,
  0,
);
