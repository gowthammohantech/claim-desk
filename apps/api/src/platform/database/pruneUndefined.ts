/**
 * Strips `undefined` values before they reach a Mongo update document.
 *
 * Two reasons this exists rather than spreading a partial straight into `$set`:
 *
 *  1. `{ field: undefined }` in an update is treated inconsistently — some
 *     driver/Mongoose versions ignore it, others write a literal null. Either
 *     way it is not what the caller meant.
 *  2. `exactOptionalPropertyTypes` is on, so an optional domain field is
 *     `T | undefined` and spreading it produces exactly that shape.
 *
 * Undefined means "leave alone". To actually clear a field, use `$unset`.
 */
export function pruneUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) output[key] = value;
  }
  return output as Partial<T>;
}

/**
 * Splits a patch into `$set` and `$unset` operators, treating `null` as an
 * explicit clear and `undefined` as "not supplied".
 */
export function toUpdateOperators<T extends Record<string, unknown>>(
  patch: T,
): { $set?: Record<string, unknown>; $unset?: Record<string, ''> } {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === null) unset[key] = '';
    else set[key] = value;
  }

  return {
    ...(Object.keys(set).length > 0 ? { $set: set } : {}),
    ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
  };
}
