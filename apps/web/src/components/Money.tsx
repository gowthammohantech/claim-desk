import { formatPaise } from '@claimdesk/domain';

import { cn } from '@/lib/utils';

interface MoneyProps {
  paise: number;
  className?: string;
  decimals?: boolean;
}

/**
 * Renders an integer-paise amount. Never accepts rupees: money crosses the wire
 * as integer paise and is only converted at the render boundary (ADR-010).
 */
export function Money({ paise, className, decimals = true }: MoneyProps) {
  return (
    <span className={cn('num tabular-nums', className)}>{formatPaise(paise, { decimals })}</span>
  );
}
