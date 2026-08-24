/**
 * Payment — public surface.
 *
 * Payment batches and payment recording.
 * Owns the `paymentBatches`, `payments` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../payment/application/...` from a sibling is a lint error.
 */
export { type PaymentModuleDeps, buildPaymentModule } from './payment.module.js';
