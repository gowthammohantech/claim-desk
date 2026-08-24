/**
 * MasterData — public surface.
 *
 * Backend-maintained master data: clients, engagements, expense categories.
 * Owns the `clients`, `engagements`, `expenseCategories` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../master-data/application/...` from a sibling is a lint error.
 */
export { type MasterDataModuleDeps, buildMasterDataModule } from './master-data.module.js';
