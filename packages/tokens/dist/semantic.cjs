"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/semantic.ts
var semantic_exports = {};
__export(semantic_exports, {
  TONES: () => TONES,
  claimStatusLabel: () => claimStatusLabel,
  claimStatusTone: () => claimStatusTone,
  policyOutcomeTone: () => policyOutcomeTone
});
module.exports = __toCommonJS(semantic_exports);
var import_contracts = require("@claimdesk/contracts");
var TONES = ["neutral", "accent", "ok", "warn", "danger", "violet"];
var CLAIM_STATUS_TONE = {
  [import_contracts.ClaimStatus.DRAFT]: "neutral",
  [import_contracts.ClaimStatus.SUBMITTED]: "accent",
  [import_contracts.ClaimStatus.IN_APPROVAL]: "accent",
  [import_contracts.ClaimStatus.RETURNED]: "warn",
  [import_contracts.ClaimStatus.REJECTED]: "danger",
  [import_contracts.ClaimStatus.APPROVED]: "ok",
  [import_contracts.ClaimStatus.FINANCE_REVIEW]: "accent",
  [import_contracts.ClaimStatus.VERIFIED]: "ok",
  [import_contracts.ClaimStatus.PAYMENT_PROCESSING]: "accent",
  [import_contracts.ClaimStatus.PAID]: "ok",
  [import_contracts.ClaimStatus.CANCELLED]: "neutral"
};
var POLICY_OUTCOME_TONE = {
  [import_contracts.PolicyOutcome.PASS]: "ok",
  [import_contracts.PolicyOutcome.WARNING]: "warn",
  [import_contracts.PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION]: "warn",
  [import_contracts.PolicyOutcome.BLOCKED]: "danger"
};
var claimStatusTone = (status) => CLAIM_STATUS_TONE[status];
var policyOutcomeTone = (outcome) => POLICY_OUTCOME_TONE[outcome];
var claimStatusLabel = (status) => status.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TONES,
  claimStatusLabel,
  claimStatusTone,
  policyOutcomeTone
});
//# sourceMappingURL=semantic.cjs.map