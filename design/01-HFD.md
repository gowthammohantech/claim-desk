# Claim Desk --- High-Level Functional Design (HFD)

**Version:** 1.0\
**Status:** Implementation Baseline\
**Product:** Claim Desk\
**Primary Channel:** Mobile\
**Supporting Channel:** Finance/Admin Web

## 1. Purpose

Translate the BRD, PRD, FRD, TDD and ClaimDesk v2 mobile prototype into
one high-level functional design. This document is the parent design for
the screen inventory, flows, data model, API, permissions, workflow,
policy, audit, integrations, deployment and test specifications.

## 2. Canonical Product Boundary

-   Employee and approver experience: **mobile first**.
-   Finance, payment, policy/workflow administration, master data,
    reporting and audit review: **web**.
-   Expense and Claim are separate domain objects.
-   Expense classification is one of
    `CLIENT_BILLABLE, CLIENT_NON_BILLABLE, INTERNAL`.
-   Client/engagement is mandatory for client classifications and absent
    for Internal.
-   Receipts are metadata in MongoDB and binary objects in Azure Blob
    Storage.
-   Submitted claims preserve policy and workflow snapshots.
-   No hard delete for submitted/financial/audit records.

## 3. Functional Domains

  -----------------------------------------------------------------------
  Domain                              Responsibility
  ----------------------------------- -----------------------------------
  Identity                            SSO, employee identity, roles,
                                      resource scope

  Employee                            Employee, manager, grade,
                                      department, branch, payment profile

  Master Data                         categories, clients, engagements,
                                      cost centres, mileage rates

  Expense                             scanned/manual/mileage expenses and
                                      drafts

  Receipt/OCR                         upload, extraction, confidence,
                                      correction

  Policy                              eligibility, limits, receipt rules,
                                      duplicates, exception handling

  Claim                               grouping expenses, declaration,
                                      submission and lifecycle

  Approval                            route resolution, decisions,
                                      return/reject, SLA, delegation

  Finance                             verification, GL/cost centre/GST
                                      review

  Payment                             payment batches/references/status

  Notification                        in-app/push/email events

  Audit                               immutable business event history

  Reporting                           employee, engagement, policy, aging
                                      and payment reports
  -----------------------------------------------------------------------

## 4. Primary Mobile Navigation

`Home | Expenses | Claims | Approvals | Profile`

Secondary routes: Notifications, Scan Receipt, OCR Review, Manual
Expense, Mileage, Policy Exception, Duplicate Resolution, Claim Review,
Claim Detail, Approval Detail.

## 5. End-to-End Functional Flow

``` text
Mobile number + OTP
 -> Employee profile + assignments
 -> Capture expense (scan/manual/mileage)
 -> Receipt/OCR where applicable
 -> Classify expense
 -> Map client/engagement when client-related
 -> Policy + duplicate evaluation
 -> Save expense
 -> Select unclaimed expenses
 -> Create claim
 -> Declaration + final validation
 -> Submit
 -> Resolve approval route snapshot
 -> Approver decision(s)
 -> Finance verification
 -> Payment processing
 -> Paid
 -> Audit/reporting throughout
```

## 6. Expense Capture Modes

### 6.1 Receipt Scan

Camera/gallery -\> Blob upload -\> OCR -\> user confirms extracted
values -\> policy/duplicate checks -\> save.

### 6.2 Manual

Amount, date, merchant, category, classification, engagement if
required, business purpose, receipt if policy requires -\> validate -\>
save.

### 6.3 Mileage

Date, route/source/destination, distance, rate snapshot, classification,
engagement if required, purpose -\> calculated amount -\> save.

## 7. Smart Checks

-   Receipt-required validation.
-   Duplicate candidate detection.
-   Category/grade/branch/engagement policy evaluation.
-   Limit overage with exception amount.
-   Minimum justification for exceptions.
-   Closed/unassigned engagement prevention.
-   Claim submission declaration.
-   Approval route impact shown before submission where possible.

## 8. Claim Lifecycle

`DRAFT -> SUBMITTED -> IN_APPROVAL -> RETURNED -> REJECTED -> APPROVED -> FINANCE_REVIEW -> VERIFIED -> PAYMENT_PROCESSING -> PAID -> CANCELLED`
is the canonical status vocabulary; transitions are constrained by
`workflow-spec.md`.

## 9. Approval Model

Route is determined at submission using claim total, classification,
engagement ownership, policy exceptions and configured workflow rules.
Route is snapshotted. Approvers may Approve, Return, or Reject.
Return/Reject require a reason. Self-approval is prohibited.

## 10. Finance and Payment

Finance reviews evidence, accounting dimensions, tax/GST details and
exceptions. Verification creates a finance decision record. Payment may
be grouped into a batch; final payment reference/date are immutable
audit facts.

## 11. Cross-Cutting Rules

-   Authorization = permission + resource scope + current workflow
    state.
-   Money uses integer paise.
-   Timestamps are stored in UTC and rendered in user locale.
-   API writes use idempotency keys where retry could duplicate a
    business action.
-   Audit events are written for material mutations and decisions.
-   No Redis/BullMQ.
-   Background OCR/notification retries use MongoDB job/outbox
    collections.
