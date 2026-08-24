import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor, toPage } from './cursor.js';
import { formatSequence } from './counters.js';
import { INDEX_SPECS, TOTAL_INDEX_COUNT } from './indexes.js';
import { allValidObjectIds, toObjectId, toObjectIds } from './objectId.js';
import { pruneUndefined, toUpdateOperators } from './pruneUndefined.js';

describe('objectId', () => {
  const VALID = '507f1f77bcf86cd799439011';

  it('accepts a 24-char hex id', () => {
    expect(toObjectId(VALID)?.toHexString()).toBe(VALID);
  });

  it('returns null rather than throwing on a malformed id', () => {
    // `new ObjectId('nope')` throws BSONError, which would surface as a 500 and
    // let an attacker distinguish malformed ids from merely-absent ones.
    for (const bad of ['nope', '', '123', 'zzzzzzzzzzzzzzzzzzzzzzzz']) {
      expect(toObjectId(bad)).toBeNull();
    }
    expect(toObjectId(null)).toBeNull();
    expect(toObjectId(undefined)).toBeNull();
  });

  it('rejects the 12-byte string form, which would silently coerce', () => {
    expect(toObjectId('abcdefghijkl')).toBeNull();
  });

  it('drops invalid ids when converting a list, and can report that it did', () => {
    expect(toObjectIds([VALID, 'nope'])).toHaveLength(1);
    expect(allValidObjectIds([VALID, 'nope'])).toBe(false);
    expect(allValidObjectIds([VALID])).toBe(true);
  });
});

describe('pruneUndefined', () => {
  it('drops undefined but keeps null, false and zero', () => {
    expect(pruneUndefined({ a: 1, b: undefined, c: null, d: false, e: 0 })).toEqual({
      a: 1,
      c: null,
      d: false,
      e: 0,
    });
  });

  it('splits a patch into $set and $unset, treating null as an explicit clear', () => {
    expect(toUpdateOperators({ keep: 'x', clear: null, absent: undefined })).toEqual({
      $set: { keep: 'x' },
      $unset: { clear: '' },
    });
  });

  it('omits an operator entirely when it would be empty', () => {
    expect(toUpdateOperators({ a: 1 })).toEqual({ $set: { a: 1 } });
    expect(toUpdateOperators({ a: undefined })).toEqual({});
  });
});

describe('cursor', () => {
  it('round-trips', () => {
    const payload = { k: '2026-08-01', i: '507f1f77bcf86cd799439011' };
    expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
  });

  it('returns null for a malformed cursor instead of throwing', () => {
    // A bad cursor is a client error; it must never become a 500.
    for (const bad of ['', 'not-base64!', Buffer.from('{}').toString('base64url')]) {
      expect(decodeCursor(bad)).toBeNull();
    }
  });

  it('omits nextCursor on the last page', () => {
    const rows = [{ id: 'a', at: 1 }, { id: 'b', at: 2 }];
    const page = toPage(rows, 5, (r) => ({ k: r.at, i: r.id }));
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeUndefined();
  });

  it('trims the over-fetched row and emits a cursor from the last kept row', () => {
    // Fetching limit+1 is how we know another page exists without a count query.
    const rows = [{ id: 'a', at: 1 }, { id: 'b', at: 2 }, { id: 'c', at: 3 }];
    const page = toPage(rows, 2, (r) => ({ k: r.at, i: r.id }));

    expect(page.items.map((r) => r.id)).toEqual(['a', 'b']);
    expect(decodeCursor(page.nextCursor!)).toEqual({ k: 2, i: 'b' });
  });
});

describe('sequence numbers', () => {
  it('matches the prototype format CLM-2026-0128', () => {
    expect(formatSequence('claim', 2026, 128)).toBe('CLM-2026-0128');
    expect(formatSequence('expense', 2026, 7)).toBe('EXP-2026-0007');
    expect(formatSequence('paymentBatch', 2026, 9)).toBe('PB-2026-0009');
  });

  it('grows past four digits rather than wrapping', () => {
    expect(formatSequence('claim', 2026, 12345)).toBe('CLM-2026-12345');
  });
});

describe('index specs', () => {
  it('names every index, so a spec change is a visible diff not a silent rebuild', () => {
    for (const { collection, indexes } of INDEX_SPECS) {
      for (const index of indexes) {
        expect(index.name, `${collection} index missing a name`).toBeTruthy();
        expect(Object.keys(index.key).length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps index names unique within a collection', () => {
    for (const { collection, indexes } of INDEX_SPECS) {
      const names = indexes.map((i) => i.name);
      expect(new Set(names).size, `duplicate index name in ${collection}`).toBe(names.length);
    }
  });

  it('declares each collection exactly once', () => {
    const collections = INDEX_SPECS.map((s) => s.collection);
    expect(new Set(collections).size).toBe(collections.length);
  });

  it('covers the collections design/04 §4 names explicitly', () => {
    const declared = new Set(INDEX_SPECS.map((s) => s.collection));
    for (const required of [
      'employees',
      'expenses',
      'claims',
      'approvalTasks',
      'policyDefinitions',
      'workflowDefinitions',
      'auditEvents',
      'outbox',
    ]) {
      expect(declared.has(required), `missing index spec for ${required}`).toBe(true);
    }
  });

  it('makes every unique index on an optional field partial', () => {
    // A plain unique index on an optional field collides on the second null.
    for (const { collection, indexes } of INDEX_SPECS) {
      for (const index of indexes) {
        if (index.name === 'uq_emailNormalized' || index.name === 'uq_idempotencyKey') {
          expect(index.partialFilterExpression, `${collection}.${index.name}`).toBeDefined();
        }
      }
    }
  });

  it('counts the total for the migration log line', () => {
    expect(TOTAL_INDEX_COUNT).toBe(
      INDEX_SPECS.reduce((sum, spec) => sum + spec.indexes.length, 0),
    );
    expect(TOTAL_INDEX_COUNT).toBeGreaterThan(40);
  });
});
