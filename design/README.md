# Claim Desk --- Design Pack

This pack is aligned to the existing BRD, PRD, FRD, TDD and ClaimDesk
Mobile v2 prototype.

## Documents

1.  `01-HFD.md`
2.  `02-screen-inventory.md`
3.  `03-user-flows.md`
4.  `04-data-model.md`
5.  `05-reimbursement.dbml`
6.  `06-api-contract.yaml`
7.  `07-permission-matrix.md`
8.  `08-workflow-spec.md`
9.  `09-policy-engine-spec.md`
10. `10-audit-event-catalog.md`
11. `11-integration-spec.md`
12. `12-deployment-architecture.md`
13. `13-test-strategy.md`
14. `ADRs/`
15. `gaps.md`

Canonical stack: React Native + Expo + TypeScript; React + Vite +
TypeScript; Express.js + TypeScript; MongoDB + Mongoose; Azure Blob; no
Redis/BullMQ.

Confirmed: Claim Desk; mobile number + OTP; MongoDB Atlas; dummy provider for now; backend-maintained master data; push only; INR only; offline draft/sync; GAP-013 screens added to required scope. Other prior gaps are not required.
