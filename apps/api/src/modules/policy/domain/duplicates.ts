/**
 * Duplicate detection.
 *
 * design/09 §10 is explicit that this is "a smart check SEPARATE from the DSL"
 * — it is scoring, not rule matching, and it must not be expressible as a
 * policy condition. Rules may still react to its output via
 * `duplicate.maxScore` in the evaluation context.
 *
 * Signals (§10): employee, merchant normalization, amount, date proximity and
 * receipt hash. Pure, so the thresholds are testable without a database.
 */
export interface DuplicateCandidate {
  expenseId: string;
  employeeId: string;
  merchantNormalized?: string | undefined;
  amountPaise: number;
  expenseDate: Date;
  receiptHashes: readonly string[];
}

export interface DuplicateScore {
  score: number;
  reasons: string[];
}

/** Above this, the pair is raised for the employee to resolve. */
export const DUPLICATE_THRESHOLD = 0.7;

/** An identical receipt hash is conclusive on its own. */
const RECEIPT_HASH_WEIGHT = 1;
const AMOUNT_WEIGHT = 0.35;
const MERCHANT_WEIGHT = 0.3;
const DATE_WEIGHT = 0.25;
const CATEGORY_DAY_WINDOW = 3;

/** Lowercase, strip punctuation and collapse whitespace, so "UBER *TRIP" == "uber trip". */
export function normalizeMerchant(merchant: string | undefined): string | undefined {
  if (!merchant) return undefined;
  const normalized = merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > 0 ? normalized : undefined;
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Both are normalized to UTC midnight on write, so this is a whole number and
  // does not drift at +5:30.
  return Math.abs(Math.round((a.getTime() - b.getTime()) / MS_PER_DAY));
}

export function scoreDuplicate(
  subject: DuplicateCandidate,
  candidate: DuplicateCandidate,
): DuplicateScore {
  const reasons: string[] = [];

  // A different employee's expense is never a duplicate of yours.
  if (subject.employeeId !== candidate.employeeId) return { score: 0, reasons };
  if (subject.expenseId === candidate.expenseId) return { score: 0, reasons };

  const sharedReceipt = subject.receiptHashes.some((hash) =>
    candidate.receiptHashes.includes(hash),
  );
  if (sharedReceipt) {
    // The same image attached twice is the same spend, whatever else differs.
    return { score: RECEIPT_HASH_WEIGHT, reasons: ['IDENTICAL_RECEIPT'] };
  }

  let score = 0;

  if (subject.amountPaise === candidate.amountPaise) {
    score += AMOUNT_WEIGHT;
    reasons.push('SAME_AMOUNT');
  }

  const subjectMerchant = normalizeMerchant(subject.merchantNormalized);
  const candidateMerchant = normalizeMerchant(candidate.merchantNormalized);
  if (subjectMerchant && candidateMerchant && subjectMerchant === candidateMerchant) {
    score += MERCHANT_WEIGHT;
    reasons.push('SAME_MERCHANT');
  }

  const dayGap = daysBetween(subject.expenseDate, candidate.expenseDate);
  if (dayGap === 0) {
    score += DATE_WEIGHT;
    reasons.push('SAME_DATE');
  } else if (dayGap <= CATEGORY_DAY_WINDOW) {
    // Partial credit — a genuine repeat purchase a day apart is common, so
    // proximity alone should not raise a case.
    score += DATE_WEIGHT * (1 - dayGap / (CATEGORY_DAY_WINDOW + 1));
    reasons.push('NEAR_DATE');
  }

  return { score: Math.round(score * 100) / 100, reasons };
}

export function isDuplicate(score: DuplicateScore): boolean {
  return score.score >= DUPLICATE_THRESHOLD;
}

/** Scores a subject against a candidate set, keeping only the real hits. */
export function findDuplicates(
  subject: DuplicateCandidate,
  candidates: readonly DuplicateCandidate[],
): Array<{ candidate: DuplicateCandidate; score: DuplicateScore }> {
  return candidates
    .map((candidate) => ({ candidate, score: scoreDuplicate(subject, candidate) }))
    .filter((entry) => isDuplicate(entry.score))
    .sort((a, b) => b.score.score - a.score.score);
}
