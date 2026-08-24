import type { ClientSession, Model, QueryFilter, UpdateQuery } from 'mongoose';

import { type GuardResult, guardFailed, guardOk } from './tx.js';

/**
 * A conditional update that carries BOTH an optimistic-concurrency guard and a
 * state guard, and can explain which one failed.
 *
 * The naive version — `findOneAndUpdate({_id, version, status}, ...)` returning
 * null — cannot distinguish "no such record", "not yours", "wrong state" and
 * "someone else got there first". They are four different HTTP answers (404,
 * 403, 409 ILLEGAL_STATE_TRANSITION, 409 STALE_VERSION), and collapsing them
 * makes the API undebuggable for the client.
 *
 * So on a miss we do exactly one more read, IN THE SAME SESSION (otherwise the
 * diagnosis is taken from outside the transaction snapshot and can contradict
 * the update), and classify.
 *
 * design/08-workflow-spec.md §10 depends on this: "Decision endpoint requires
 * current task version/state. First valid terminal decision wins; stale
 * attempts return HTTP 409."
 */
export interface GuardSpec<TDoc> {
  /** Identity only — never include version or state here. */
  identity: QueryFilter<TDoc>;
  /** Ownership / assignment predicate. A mismatch means 403, not 404. */
  ownership?: QueryFilter<TDoc> | undefined;
  /** States the operation is legal from. A mismatch means 409 illegal-state. */
  state?: QueryFilter<TDoc> | undefined;
  /** Expected optimistic-concurrency version. A mismatch means 409 stale. */
  version?: number | undefined;
  /** The version field name. Defaults to `version`; never `__v`. */
  versionField?: string;
}

export interface GuardedUpdateOptions<TDoc> {
  model: Model<TDoc>;
  spec: GuardSpec<TDoc>;
  update: UpdateQuery<TDoc>;
  session: ClientSession;
  /** Bump the version field. True for real mutations, false for lease touches. */
  incrementVersion?: boolean;
}

export async function guardedUpdate<TDoc>({
  model,
  spec,
  update,
  session,
  incrementVersion = true,
}: GuardedUpdateOptions<TDoc>): Promise<GuardResult<TDoc>> {
  const versionField = spec.versionField ?? 'version';

  const filter = {
    ...spec.identity,
    ...(spec.ownership ?? {}),
    ...(spec.state ?? {}),
    ...(spec.version === undefined ? {} : { [versionField]: spec.version }),
  } as QueryFilter<TDoc>;

  const finalUpdate = incrementVersion
    ? ({
        ...update,
        $inc: { ...(update.$inc ?? {}), [versionField]: 1 },
      } as UpdateQuery<TDoc>)
    : update;

  const updated = await model
    .findOneAndUpdate(filter, finalUpdate, { new: true, session })
    .lean<TDoc>()
    .exec();

  if (updated) return guardOk(updated);

  // ─── Diagnose, in the same session ────────────────────────────────────────
  const current = await model
    .findOne(spec.identity)
    .session(session)
    .lean<Record<string, unknown>>()
    .exec();

  if (!current) return guardFailed<TDoc>('not-found');

  if (spec.ownership) {
    const ownershipMiss = Object.entries(spec.ownership).some(
      ([key, expected]) => !matchesScalar(current[key], expected),
    );
    // Deliberately 'forbidden' and not 'not-found': the caller already proved
    // they can address this record, so hiding it buys nothing. Route handlers
    // may still choose to render 404 for resources the actor may not enumerate.
    if (ownershipMiss) return guardFailed<TDoc>('forbidden');
  }

  if (spec.version !== undefined && current[versionField] !== spec.version) {
    return guardFailed<TDoc>('stale-version');
  }

  // Identity, ownership and version all matched, so the state guard is what
  // rejected it.
  return guardFailed<TDoc>('illegal-state');
}

/** Handles the `{$in: [...]}` form used by state guards; scalars compare directly. */
function matchesScalar(actual: unknown, expected: unknown): boolean {
  if (expected !== null && typeof expected === 'object' && '$in' in expected) {
    const candidates = (expected as { $in: unknown[] }).$in;
    return candidates.some((candidate) => String(candidate) === String(actual));
  }
  return String(actual) === String(expected);
}
