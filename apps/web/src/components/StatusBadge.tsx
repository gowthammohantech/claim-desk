import type { ClaimStatus } from '@claimdesk/contracts';
import { claimStatusLabel, claimStatusTone, type Tone } from '@claimdesk/tokens/semantic';

import { cn } from '@/lib/utils';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-paper-sunken text-ink-55',
  accent: 'bg-accent-tint text-accent-deep',
  ok: 'bg-ok-tint text-ok',
  warn: 'bg-warn-tint text-warn',
  danger: 'bg-danger-tint text-danger',
  violet: 'bg-violet-tint text-violet',
};

/**
 * Claim status chip. Terminology and colour come from shared code so web and
 * mobile stay identical — PRD §13 requires consistent status wording across
 * both surfaces.
 */
export function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1 text-caption font-semibold',
        TONE_CLASS[claimStatusTone(status)],
      )}
    >
      {claimStatusLabel(status)}
    </span>
  );
}
