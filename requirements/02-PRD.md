# Product Requirements Document (PRD)

## Claim Desk --- Internal Employee Reimbursement Mobile Application

**Version:** 1.1\
**Status:** Updated Draft\
**Date:** 23 August 2026 **Product:** Claim Desk\
**Product Type:** Internal Mobile-First Employee Reimbursement
Application\
**Industry:** Audit / Professional Services

## 1. Product Vision

Claim Desk is a mobile-first internal reimbursement product for
audit-firm employees. It should let an employee capture a business
expense in seconds, associate it with the correct client/engagement,
submit a claim, obtain approval, and track reimbursement through payment
while preserving policy compliance and audit evidence.

## 2. Product Identity & Channels

**Product Name:** Claim Desk\
**Primary Platform:** iOS and Android mobile application\
**Supporting Platform:** Finance/Admin web portal

### Product Channels

### Claim Desk Mobile Application --- Primary Product

Primary users: - Employees - Reporting Managers - Engagement Managers -
Partners/Approvers

### Finance/Admin Web Portal --- Supporting Product

Primary users: - Finance - Administrators - Management -
Audit/Compliance reviewers

## 2.1 MVP Product Goal

``` text
Open Claim Desk
 → Capture/Upload Receipt
 → Verify OCR Data
 → Select Category
 → Select Client/Engagement when applicable
 → See Policy Result
 → Save Expense
 → Add Expense(s) to Claim
 → Submit Claim
 → Track Approval
 → Track Finance Verification
 → See Paid Status
```

Approvers must be able to review and act on assigned claims from the
Claim Desk mobile application.

## 3. Personas

### Employee

Needs to capture expenses quickly, avoid manual forms, know claim
status, and receive reimbursement without repeated follow-up.

### Approver

Needs a concise view of business purpose, engagement, receipts, policy
exceptions, and total amount to make quick decisions.

### Finance User

Needs complete evidence, accounting attributes, policy results, approval
history, and tools to process claims efficiently.

### Administrator

Needs configurable masters, policies, approval rules, roles, and system
controls.

### Management

Needs visibility into reimbursement liabilities, client/engagement
costs, exceptions, and processing performance.

## 4. Product Principles

1.  Capture expenses at the moment they occur.
2.  Minimize employee data entry.
3.  Make client/engagement allocation explicit.
4.  Validate policy before submission.
5.  Keep approval actions simple but informed.
6.  Preserve financial traceability.
7.  Make business rules configurable.
8.  Separate expense capture from claim submission.

## 5. Information Architecture --- Mobile

``` text
Login
 └── Home
      ├── Add Expense
      │    ├── Scan Receipt
      │    ├── Manual Expense
      │    └── Mileage
      ├── Expenses
      │    ├── Draft
      │    └── Unclaimed
      ├── Claims
      │    ├── Draft
      │    ├── Submitted
      │    ├── In Approval
      │    ├── Approved
      │    ├── Returned / Rejected
      │    └── Paid
      ├── Approvals
      ├── Notifications
      └── Profile
```

## 6. Information Architecture --- Web

``` text
Dashboard
 ├── Claims
 │    ├── Pending Finance Review
 │    ├── Verified
 │    ├── Payment Queue
 │    └── Paid
 ├── Expenses
 ├── Clients
 ├── Engagements
 ├── Employees
 ├── Policies
 ├── Approval Workflows
 ├── Masters
 ├── Reports
 ├── Audit Logs
 └── Administration
```

## 7. Product Modules

### P-01 Authentication & Employee Profile

Capabilities: - Sign in through organization identity provider or
configured authentication method - Employee profile -
Department/branch/designation - Reporting manager - Engagement
assignments - Reimbursement/payment profile where applicable

### P-02 Home Dashboard

Employee dashboard: - Quick Add Expense - Unclaimed expenses - Draft
claims - Pending claims - Approved amount - Recently paid claims -
Action-required items

Approver dashboard: - Pending approvals - Aging approvals -
Policy-exception claims

### P-03 Expense Capture

Employee can: - Scan/upload receipt - Create manual expense - Create
mileage expense - Save draft - Add notes - Add multiple attachments

Core fields: - Expense date - Merchant - Amount - Currency -
Category/subcategory - Classification - Client - Engagement - Business
purpose - Receipt(s) - Tax details where relevant

### P-04 Receipt OCR

OCR should attempt to extract: - Merchant - Receipt/invoice number -
Date - Total - Currency - GSTIN where applicable - Taxable amount -
CGST/SGST/IGST or tax components where available

All extracted fields remain user-verifiable.

### P-05 Client & Engagement Allocation

For client-related expenses:

``` text
Expense
 → Client
 → Engagement
 → Billable / Non-Billable
```

The employee should normally see only engagements available to them,
subject to business configuration.

### P-06 Policy Validation

During entry/submission the product should display:

-   Within Policy
-   Warning
-   Exception --- justification required
-   Blocking Error

Example:

``` text
Accommodation limit: ₹4,000/night
Claimed: ₹5,500
Exceeded by: ₹1,500
Action: Provide justification
```

### P-07 Expense Claim

Employee can select eligible expenses and create one claim.

Claim includes: - Claim number - Claim title/purpose - Expense lines -
Total claimed amount - Policy exceptions - Attachments - Declaration -
Submission timestamp

### P-08 Approval Inbox

Approvers can: - View claim summary - View expense lines - Open
receipts - View client/engagement - View policy violations - View
employee justification - Approve - Reject - Return for correction -
Comment

Future enhancement: line-level approval.

### P-09 Finance Verification

Web-focused capabilities: - Finance work queue - Receipt verification -
Tax review - GL/account assignment - Cost-center assignment -
Reimbursable amount verification - Return to employee/approver where
permitted - Mark verified

### P-10 Payment Processing

Finance can: - Select verified claims - Create payment batch - Export
payment instructions or send to integration - Record payment reference -
Record payment date - Mark paid

Employee sees final payment status.

### P-11 Notifications

Events include: - Claim submitted - Approval requested - Claim
approved - Claim rejected - Claim returned - Additional information
requested - Finance verified - Payment processed - SLA/escalation
reminders

Channels initially: - In-app - Push notification - Email where
configured

### P-12 Policy Administration

Web administration for: - Expense categories - Limits - Receipt rules -
Mileage rates - Submission windows - Employee-level rules - Location
rules - Exception behavior - Effective dates

### P-13 Workflow Administration

Configure approval workflows using conditions such as: - Amount -
Expense classification - Department - Employee grade - Client -
Engagement - Policy exception

### P-14 Reporting

Dashboards/reports for: - Spend - Claims - Approvals - Payments -
Engagement costs - Client-billable expenses - Exceptions - SLA aging

### P-15 Audit Trail

Authorized users can inspect chronological history of expense, claim,
approval, finance, and payment actions.

## 8. Claim Lifecycle

``` text
DRAFT
  ↓
SUBMITTED
  ↓
IN_APPROVAL
  ├── RETURNED → DRAFT/REVISION → SUBMITTED
  ├── REJECTED
  ↓
APPROVED
  ↓
FINANCE_REVIEW
  ├── RETURNED
  ↓
VERIFIED
  ↓
PAYMENT_PROCESSING
  ↓
PAID
```

Optional `WITHDRAWN` and `CANCELLED` states should be supported
according to rules.

## 9. Key User Journeys

### Journey A --- Scan and Save Expense

1.  Employee taps Add Expense.
2.  Captures receipt.
3.  OCR extracts information.
4.  Employee confirms/corrects fields.
5.  Selects category.
6.  Selects classification.
7.  Selects client/engagement if required.
8.  Policy engine evaluates expense.
9.  Employee provides justification if required.
10. Saves expense.

### Journey B --- Submit Claim

1.  Employee opens unclaimed expenses.
2.  Selects expenses.
3.  Creates claim.
4.  Reviews totals and exceptions.
5.  Accepts declaration.
6.  Submits.
7.  Workflow engine determines approver(s).

### Journey C --- Approve

1.  Approver receives notification.
2.  Opens claim.
3.  Reviews summary and exceptions.
4.  Opens supporting receipts when needed.
5.  Approves, returns, or rejects.
6.  Workflow advances automatically.

### Journey D --- Finance to Payment

1.  Finance receives approved claim.
2.  Reviews evidence/accounting information.
3.  Resolves issues or returns claim.
4.  Marks verified.
5.  Adds claim to payment batch.
6.  Payment occurs.
7.  Reference/date recorded.
8.  Employee is notified.

## 10. MVP Scope

### Must Have

-   Authentication
-   Employee profile
-   Expense capture
-   Receipt upload/camera
-   OCR
-   Categories
-   Client/engagement mapping
-   Billable/non-billable/internal classification
-   Policy validation
-   Claim creation/submission
-   Approval workflow
-   Approver inbox
-   Finance verification
-   Payment status
-   Notifications
-   Audit trail
-   Core reports
-   Admin masters
-   RBAC

### Should Have

-   Mileage
-   Approval delegation
-   Escalation
-   Payment batching
-   Data export
-   Policy versioning/effective dates

### Later

-   Accounting integration
-   Bank integration
-   Corporate cards
-   Travel platform
-   Advanced AI/fraud detection
-   Engagement profitability

## 11. High-Level Acceptance Outcomes

The product is ready for initial production when:

-   Employees can capture and submit a compliant reimbursement claim
    end-to-end.
-   Client expenses can be assigned to valid engagements.
-   Policy violations are detected according to configuration.
-   Claims route to the correct approver(s).
-   Approvers can act from mobile.
-   Finance can verify and mark reimbursement paid.
-   Employees can track claim status.
-   Every material transition is auditable.
-   Unauthorized users cannot access claims outside permitted scope.

## 12. Product Analytics

Track events such as: - expense_created - receipt_scanned -
ocr_completed - ocr_field_corrected - policy_warning_triggered -
claim_submitted - claim_returned - claim_rejected - claim_approved -
finance_verified - payment_completed

## 13. UX Expectations

-   New expense should require minimal taps.
-   Camera should be a primary entry action.
-   OCR must never silently overwrite user-confirmed values.
-   Policy issues should explain both problem and required action.
-   Approval screens should surface exceptions before normal details.
-   Status terminology should be consistent across mobile and web.
-   Receipts should be accessible without excessive navigation.

## 14. Dependencies

-   Employee directory/identity source
-   Reporting hierarchy
-   Client master
-   Engagement master
-   Expense/category policy decisions
-   Finance/accounting master data
-   Payment process
-   Notification infrastructure

## 15. Open Product Decisions

-   SSO provider
-   Whether employees may withdraw submitted claims
-   Whether approvers can edit coding/classification
-   Whether partial/line-level rejection is needed for MVP
-   Whether finance may modify reimbursable amount
-   Whether payment execution is inside or outside the product
-   Offline requirements
-   Supported currencies
