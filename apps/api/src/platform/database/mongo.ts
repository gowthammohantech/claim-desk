import mongoose from 'mongoose';

import type { Env } from '../config/env.js';
import type { AppLogger } from '../observability/logger.js';

/**
 * MongoDB connection.
 *
 * Connecting is LAZY and optional: with `MONGODB_URI` unset the process still
 * boots and `/v1/health` reports `mongo: "skipped"`. That keeps the skeleton
 * runnable before any database exists, and keeps the HTTP layer independently
 * diagnosable in production when Mongo is the thing that is down.
 *
 * The URI must point at a REPLICA SET. design/08-workflow-spec.md commits the
 * claim transition and the first approval task in a single transaction, and
 * Mongo transactions do not exist on a standalone mongod.
 */
export type MongoStatus = 'skipped' | 'connected' | 'disconnected' | 'error';

let status: MongoStatus = 'skipped';

export function mongoStatus(): MongoStatus {
  if (status === 'skipped') return 'skipped';
  return mongoose.connection.readyState === 1 ? 'connected' : status;
}

export async function connectMongo(env: Env, logger: AppLogger): Promise<MongoStatus> {
  if (!env.MONGODB_URI) {
    logger.warn(
      { reason: 'MONGODB_URI not set' },
      'mongo.skipped — running without a database; persistence is unavailable',
    );
    status = 'skipped';
    return status;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
    });
    status = 'connected';
    logger.info({ db: env.MONGODB_DB_NAME }, 'mongo.connected');
  } catch (error) {
    status = 'error';
    logger.error({ err: error }, 'mongo.connect_failed');
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    status = 'disconnected';
    logger.warn('mongo.disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    status = 'connected';
    logger.info('mongo.reconnected');
  });

  return status;
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  status = 'skipped';
}
