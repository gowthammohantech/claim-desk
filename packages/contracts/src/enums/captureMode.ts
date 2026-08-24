/** How an expense was captured. */
export const CaptureMode = {
  SCAN: 'SCAN',
  MANUAL: 'MANUAL',
  MILEAGE: 'MILEAGE',
} as const;

export type CaptureMode = (typeof CaptureMode)[keyof typeof CaptureMode];

export const CAPTURE_MODES = Object.values(CaptureMode) as readonly CaptureMode[];
