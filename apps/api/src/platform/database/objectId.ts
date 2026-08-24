import { Types } from 'mongoose';

/**
 * Safe string -> ObjectId conversion.
 *
 * `new ObjectId('nope')` THROWS a BSONError. Every repository takes ids that
 * arrived from a URL, and the shared `objectId` zod schema is only
 * `z.string().min(1)` — no hex check — so an id like `/expenses/nope` would
 * reach the driver and surface as a 500. That is both a bad error and a probing
 * oracle: a malformed id would be distinguishable from a well-formed one that
 * simply does not exist.
 *
 * Returning `null` lets callers treat "not a valid id" and "no such record"
 * identically, which is what a client should see.
 */
export function toObjectId(id: string | null | undefined): Types.ObjectId | null {
  if (!id || !Types.ObjectId.isValid(id)) return null;
  // isValid() also accepts 12-byte strings, which would silently coerce to a
  // different id than the caller meant. Only accept the 24-char hex form.
  if (id.length !== 24) return null;
  return new Types.ObjectId(id);
}

/** Converts a list of ids, dropping any that are not well-formed. */
export function toObjectIds(ids: readonly string[]): Types.ObjectId[] {
  return ids.map(toObjectId).filter((id): id is Types.ObjectId => id !== null);
}

/**
 * True when every supplied id was well-formed. Use before a bulk operation
 * where a silently-dropped id would under-count and produce a wrong result.
 */
export function allValidObjectIds(ids: readonly string[]): boolean {
  return ids.every((id) => toObjectId(id) !== null);
}

export const toIdString = (id: Types.ObjectId): string => id.toHexString();
