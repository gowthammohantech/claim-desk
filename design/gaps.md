# Claim Desk — Gap Resolution

**Version:** 2.0  
**Status:** Closed for current scope

| Gap | Final Decision | Status |
|---|---|---|
| GAP-001 | Product name is **Claim Desk** | RESOLVED |
| GAP-002 | Authentication is **mobile number + OTP** | RESOLVED |
| GAP-003 | Database service is **MongoDB Atlas** | RESOLVED |
| GAP-004 | Use **dummy integration/provider for now** | RESOLVED |
| GAP-005 | HR/master data is maintained **manually from the backend for now** | RESOLVED |
| GAP-008 | **Push notification only** | RESOLVED |
| GAP-010 | Existing approval threshold/routing baseline is accepted | RESOLVED |
| GAP-013 | Missing required screens must be added/updated | RESOLVED / ACTION |
| GAP-018 | Offline local drafts/sync is required; submit/approve/pay require server confirmation | RESOLVED |
| GAP-019 | **INR only**; money stored as integer paise | RESOLVED |
| GAP-020 | Current audit trail/event catalog is accepted for current scope | RESOLVED |

## Not Required / Ignored
All other previously listed gaps are **not required for the current scope** and must not be treated as blockers or pending requirements.

## Current Baseline
Claim Desk; React Native + Expo mobile; React + Vite web; Express.js + TypeScript backend; MongoDB + Mongoose on MongoDB Atlas; Azure Blob receipts; mobile number + OTP; dummy provider for now; manually maintained backend master data; push notifications only; INR only; no Redis/BullMQ; offline draft/sync; policy/workflow snapshots; no hard delete for submitted/financial/audit records.
