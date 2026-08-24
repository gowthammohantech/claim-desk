export { type MongoStatus, connectMongo, disconnectMongo, mongoStatus } from './mongo.js';
export { withTransaction } from './withTransaction.js';

// ─── unit of work ───────────────────────────────────────────────────────────
export {
  type AuditEventInput,
  type AuditSource,
  type GuardFailure,
  type GuardResult,
  type OutboxEventInput,
  type Tx,
  type TxActor,
  type TxOptions,
  type TxScope,
  type UnitOfWork,
  guardFailed,
  guardOk,
  mapGuardResult,
} from './tx.js';
export {
  type AuditRecord,
  type MongoUnitOfWorkDeps,
  type OutboxRecord,
  type UnitOfWorkWriters,
  MissingAuditError,
  createMongoUnitOfWork,
  sessionOf,
} from './mongoUnitOfWork.js';

// ─── persistence helpers ────────────────────────────────────────────────────
export { type GuardSpec, type GuardedUpdateOptions, guardedUpdate } from './guardedUpdate.js';
export { allValidObjectIds, toIdString, toObjectId, toObjectIds } from './objectId.js';
export { pruneUndefined, toUpdateOperators } from './pruneUndefined.js';
export {
  type CursorPayload,
  type Page,
  decodeCursor,
  encodeCursor,
  keysetFilterDesc,
  toPage,
} from './cursor.js';
export {
  type CounterDoc,
  type SequenceScope,
  CounterModel,
  allocateNumber,
  formatSequence,
  nextSequence,
} from './counters.js';

// ─── schema migrations ──────────────────────────────────────────────────────
export { type CollectionIndexSpec, type IndexSpec, INDEX_SPECS, TOTAL_INDEX_COUNT } from './indexes.js';
export {
  type IdempotencyKeyDoc,
  IDEMPOTENCY_LOCK_MS,
  IDEMPOTENCY_RETENTION_MS,
  IdempotencyKeyModel,
} from './idempotency.js';
export { type Migration, MIGRATIONS, isDuplicateKey, runMigrations } from './migrations/runner.js';
