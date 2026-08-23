# Claim Desk --- Test Strategy

**Version:** 1.0

## 1. Scope

Mobile, web, Express API, Mongo persistence, Blob receipt storage, OCR
adapters, policy engine, approval engine, finance/payment flows,
integrations, security and audit.

## 2. Test Pyramid

-   Unit: policy predicates/actions, workflow resolution, money/mileage,
    validators, authorization.
-   Component: Express modules with repositories mocked only at external
    boundaries.
-   Integration: API + real test MongoDB + Blob emulator/test account +
    adapter stubs.
-   Contract: OpenAPI request/response and integration adapter
    contracts.
-   E2E: mobile/web critical journeys.
-   Non-functional: performance, security, accessibility, resilience and
    recovery.

## 3. Critical E2E Scenarios

1.  SSO -\> scan -\> OCR -\> save within-policy expense.
2.  Manual expense with required receipt.
3.  Mileage calculation with rate snapshot.
4.  Client expense rejects missing engagement.
5.  Closed/unassigned engagement cannot be selected.
6.  Accommodation exception requires justification and adds Partner.
7.  Duplicate discard.
8.  Duplicate keep with reason/audit.
9.  Claim declaration required.
10. Claim submission creates route snapshot.
11. Self-approval prevented.
12. Approve through multiple stages.
13. Return -\> correction -\> resubmit.
14. Reject with reason.
15. Concurrent approval -\> one succeeds, stale one gets 409.
16. Finance verify.
17. Finance return.
18. Payment batch -\> paid reference.
19. Notification deep-link.
20. Audit trail contains complete chain.
21. Offline draft sync.
22. OCR/provider timeout retry.
23. Outbox retry without duplicate notification/integration.
24. Employee deactivated after historical claim remains readable to
    authorized staff.

## 4. API Quality Gates

OpenAPI lint passes; no undocumented production endpoints; negative
authorization tests; idempotency tests for submit/decision/payment;
schema validation.

## 5. Security

OWASP API Top 10, OTP abuse/rate-limit and token tampering, IDOR/BOLA, role escalation,
self-approval, upload MIME/signature/size, SAS expiry, injection, mass
assignment, rate limiting, secret leakage.

## 6. Performance Targets

Validate TDD targets under realistic mobile/API traffic. Special tests:
claim list, finance queue, audit explorer, OCR backlog and Mongo
indexes.

## 7. Mobile

iOS/Android supported versions, camera permission, gallery permission,
interrupted upload, low connectivity, background/foreground, deep links,
safe-area, accessibility, reduced motion.

## 8. Web

Chrome/Edge baseline, keyboard navigation, responsive finance screens,
bulk payment operations, filters/export.

## 9. Data/Recovery

Backup restore drill before production; payment/audit reconciliation;
job lock expiry/recovery; duplicate event replay.

## 10. Exit Criteria

No open Sev-1/Sev-2; critical E2E 100% pass; security findings
accepted/remediated; performance within agreed target; UAT sign-off;
deployment rollback verified.
