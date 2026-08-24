import type { MasterDataRepository } from './application/ports/masterDataRepository.js';
import { createMongoMasterDataRepository } from './infrastructure/mongoMasterDataRepository.js';

/** Owns `clients`, `engagements`, `expenseCategories` and `roles`. */
export interface MasterDataModule {
  masterData: MasterDataRepository;
}

export function buildMasterDataModule(): MasterDataModule {
  return { masterData: createMongoMasterDataRepository() };
}
