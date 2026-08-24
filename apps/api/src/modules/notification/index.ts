/**
 * Notification — public surface.
 *
 * In-app notification records and push dispatch. Push is the only channel in scope (GAP-008).
 * Owns the `notifications` collection.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../notification/application/...` from a sibling is a lint error.
 */
export { type NotificationModuleDeps, buildNotificationModule } from './notification.module.js';
