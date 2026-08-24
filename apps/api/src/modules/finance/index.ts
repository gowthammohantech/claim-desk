/**
 * Finance — public surface.
 *
 * Finance queue, verification and return.
 * Owns the `financeReviews` collection.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../finance/application/...` from a sibling is a lint error.
 */
export { type FinanceModuleDeps, buildFinanceModule } from './finance.module.js';
