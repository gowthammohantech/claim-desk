import mongoose from 'mongoose';

import type { AppLogger } from '../../observability/logger.js';
import { INDEX_SPECS, TOTAL_INDEX_COUNT } from '../indexes.js';

/**
 * Schema migrations, run ONLY from the deployment pipeline via `ROLE=migrate`
 * (requirements/TDD.md §29: index creation and data migrations are controlled
 * in the deployment workflow, never run from a developer machine).
 *
 * Two rules this runner obeys:
 *
 *  1. **No transaction.** DDL is not transactional in MongoDB, and an index
 *     build inside a session fails outright.
 *  2. **Additive only.** `createIndexes` never drops. That is what makes a
 *     rolling deploy safe: old pods keep the indexes they rely on. Removing an
 *     index is a separate, deliberate contract-phase migration.
 */
export interface Migration {
  id: string;
  description: string;
  up: (logger: AppLogger) => Promise<void>;
}

interface MigrationRecord {
  migrationId: string;
  appliedAt: Date;
  durationMs: number;
}

const MIGRATIONS_COLLECTION = '_migrations';

/** 0001 — the index set from design/04-data-model.md §4 plus the DBML uniques. */
export const createCoreIndexes: Migration = {
  id: '0001-core-indexes',
  description: 'Create every index declared in platform/database/indexes.ts',
  async up(logger) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection.');

    for (const { collection, indexes } of INDEX_SPECS) {
      // createIndexes is idempotent for identical specs, and errors loudly if a
      // name is reused with different keys — which is exactly the signal you
      // want when a spec changes underneath an existing index.
      await db.collection(collection).createIndexes(indexes);
      logger.debug({ collection, count: indexes.length }, 'migrate.indexes_created');
    }

    logger.info(
      { collections: INDEX_SPECS.length, indexes: TOTAL_INDEX_COUNT },
      'migrate.indexes_applied',
    );
  },
};

export const MIGRATIONS: readonly Migration[] = [createCoreIndexes];

/**
 * Applies pending migrations in order, recording each.
 *
 * Concurrency: two migrate pods can start together, so the ledger's unique
 * index on `migrationId` is the lock. The loser gets a duplicate-key error and
 * treats the migration as already applied.
 */
export async function runMigrations(logger: AppLogger): Promise<{ applied: number }> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database connection — set MONGODB_URI before migrating.');

  const ledger = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  await ledger.createIndex({ migrationId: 1 }, { name: 'uq_migrationId', unique: true });

  let applied = 0;

  for (const migration of MIGRATIONS) {
    const existing = await ledger.findOne({ migrationId: migration.id });
    if (existing) {
      logger.debug({ migrationId: migration.id }, 'migrate.already_applied');
      continue;
    }

    const startedAt = Date.now();
    logger.info({ migrationId: migration.id, description: migration.description }, 'migrate.applying');

    await migration.up(logger);

    try {
      await ledger.insertOne({
        migrationId: migration.id,
        appliedAt: new Date(),
        durationMs: Date.now() - startedAt,
      });
      applied += 1;
      logger.info(
        { migrationId: migration.id, durationMs: Date.now() - startedAt },
        'migrate.applied',
      );
    } catch (error) {
      if (isDuplicateKey(error)) {
        // Another migrate pod won the race and applied it first. Index creation
        // is idempotent, so both runs converge on the same state.
        logger.warn({ migrationId: migration.id }, 'migrate.applied_concurrently');
        continue;
      }
      throw error;
    }
  }

  return { applied };
}

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
