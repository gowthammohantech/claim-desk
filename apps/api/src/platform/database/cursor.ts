/**
 * Opaque cursor pagination.
 *
 * Skip/limit paging is wrong for these lists: an expense inserted while the
 * user pages will shift every subsequent page and silently hide a row. Keyset
 * pagination on `(sortValue, _id)` is stable under concurrent insert.
 *
 * The cursor is base64url so clients cannot read structure into it and start
 * constructing their own — it is ours to change.
 */
export interface CursorPayload {
  /** The sort key value of the last row on the previous page. */
  k: string | number;
  /** Tie-breaker id, so rows sharing a sort value still page deterministically. */
  i: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('k' in parsed) ||
      !('i' in parsed) ||
      typeof (parsed as CursorPayload).i !== 'string'
    ) {
      return null;
    }
    const { k, i } = parsed as CursorPayload;
    if (typeof k !== 'string' && typeof k !== 'number') return null;
    return { k, i };
  } catch {
    // A malformed cursor is a client error, not a server one. Callers treat
    // null as "start from the beginning" or reject with 422 — never a 500.
    return null;
  }
}

/**
 * Builds the keyset filter for a descending sort.
 * Rows strictly after `(k, i)`: either a smaller sort value, or the same value
 * with a smaller id.
 */
export function keysetFilterDesc(
  field: string,
  cursor: CursorPayload,
  idValue: unknown,
): Record<string, unknown> {
  return {
    $or: [{ [field]: { $lt: cursor.k } }, { [field]: cursor.k, _id: { $lt: idValue } }],
  };
}

export interface Page<T> {
  items: T[];
  nextCursor?: string | undefined;
}

/**
 * Trims an over-fetched result to the page size and derives the next cursor.
 * Query `limit + 1` rows so the presence of an extra row — rather than a second
 * count query — tells you whether another page exists.
 */
export function toPage<T>(
  rows: readonly T[],
  limit: number,
  toCursor: (row: T) => CursorPayload,
): Page<T> {
  if (rows.length <= limit) return { items: [...rows] };

  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return {
    items,
    ...(last ? { nextCursor: encodeCursor(toCursor(last)) } : {}),
  };
}
