export { type MasterDataModule, buildMasterDataModule } from './master-data.module.js';
export type { MasterDataRepository } from './application/ports/index.js';
export {
  type Client,
  type Engagement,
  type ExpenseCategory,
  type Role,
  isSelectable,
} from './domain/index.js';
