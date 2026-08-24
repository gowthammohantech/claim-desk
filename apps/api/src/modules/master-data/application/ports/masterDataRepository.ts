import type { Tx } from '../../../../platform/database/index.js';
import type { Client, Engagement, ExpenseCategory, Role } from '../../domain/masterData.js';

export interface MasterDataRepository {
  findClientById(id: string, tx?: Tx): Promise<Client | null>;
  listClients(tx?: Tx): Promise<Client[]>;

  findEngagementById(id: string, tx?: Tx): Promise<Engagement | null>;
  findEngagementsByIds(ids: readonly string[], tx?: Tx): Promise<Engagement[]>;
  /** OPEN engagements the employee is assigned to (design/11 §3). */
  listSelectableEngagements(employeeId: string, tx?: Tx): Promise<Engagement[]>;

  findCategoryById(id: string, tx?: Tx): Promise<ExpenseCategory | null>;
  listCategories(tx?: Tx): Promise<ExpenseCategory[]>;

  listRoles(tx?: Tx): Promise<Role[]>;
}
