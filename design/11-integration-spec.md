# Claim Desk --- Integration Specification

**Version:** 1.0

## 1. Integration Principles

Adapters isolate providers. Every inbound record carries external
ID/source. Every outbound operation is idempotent where the target
permits. Failures are retried through MongoDB jobs/outbox; no
Redis/BullMQ.

## 2. HR / Identity
For the current scope, employee/HR/master data is maintained manually through backend/admin operations.
Authentication is mobile number + OTP. Mobile number maps to one active employee.
OTP delivery/verification uses a dummy adapter for now; a production SMS provider is deferred.

## 3. Client / Engagement
For the current scope, client/engagement/master data is maintained manually from the backend.
Only open engagements assigned to the employee are selectable; historical closed engagements remain readable.

## 4. OCR
Use a dummy OCR adapter for now so scan/OCR flows can be completed without a production provider.
`submitReceipt(blobRef) -> jobRef`
`getResult(jobRef) -> extracted fields + confidence`
The dummy adapter returns deterministic sample fields and remains replaceable behind the same port.

## 5. Accounting

Outbound after Finance verification/payment as configured: claim number,
employee, expense lines, category/GL, cost centre, client/engagement,
tax/GST, amount, payment reference. MVP may use export file if
accounting API is unavailable.

## 6. Payment

Possible modes: accounting/payroll export, bank/payment file, external
payment API, manual reference import. Exact provider is an open
business/integration decision.

## 7. Notifications
Push notification is the only notification channel in the current scope.
Domain events create notification records and enqueue push delivery through a replaceable adapter.

## 8. Error Handling

Each integration run records status/counters/errors. Poison jobs stop
after configurable max attempts and require Admin retry. Never silently
drop integration events.

## 9. Security

TLS, secret storage outside source code, least-privilege service
credentials, signed/validated callbacks, allow-list where supported, PII
minimization.
