/**
 * Receipt — public surface.
 *
 * Receipt upload intents (Azure Blob SAS) and OCR results (ADR-005).
 * Owns the `receipts`, `ocrResults` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../receipt/application/...` from a sibling is a lint error.
 */
export { type ReceiptModuleDeps, buildReceiptModule } from './receipt.module.js';
