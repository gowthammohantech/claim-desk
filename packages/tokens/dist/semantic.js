// src/semantic.ts
import { ClaimStatus, PolicyOutcome } from "@claimdesk/contracts";
var TONES = ["neutral", "accent", "ok", "warn", "danger", "violet"];
var CLAIM_STATUS_TONE = {
  [ClaimStatus.DRAFT]: "neutral",
  [ClaimStatus.SUBMITTED]: "accent",
  [ClaimStatus.IN_APPROVAL]: "accent",
  [ClaimStatus.RETURNED]: "warn",
  [ClaimStatus.REJECTED]: "danger",
  [ClaimStatus.APPROVED]: "ok",
  [ClaimStatus.FINANCE_REVIEW]: "accent",
  [ClaimStatus.VERIFIED]: "ok",
  [ClaimStatus.PAYMENT_PROCESSING]: "accent",
  [ClaimStatus.PAID]: "ok",
  [ClaimStatus.CANCELLED]: "neutral"
};
var POLICY_OUTCOME_TONE = {
  [PolicyOutcome.PASS]: "ok",
  [PolicyOutcome.WARNING]: "warn",
  [PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION]: "warn",
  [PolicyOutcome.BLOCKED]: "danger"
};
var claimStatusTone = (status) => CLAIM_STATUS_TONE[status];
var policyOutcomeTone = (outcome) => POLICY_OUTCOME_TONE[outcome];
var claimStatusLabel = (status) => status.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
export {
  TONES,
  claimStatusLabel,
  claimStatusTone,
  policyOutcomeTone
};
//# sourceMappingURL=semantic.js.map