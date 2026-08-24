/** Delivery channels. Push is the only channel in the current scope (gaps.md GAP-008); email is explicitly out. */
export const NotificationChannel = {
  PUSH: 'PUSH',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NOTIFICATION_CHANNELS = Object.values(NotificationChannel) as readonly NotificationChannel[];
