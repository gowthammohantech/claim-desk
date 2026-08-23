# Functional Requirements Document (FRD)

## Claim Desk --- Internal Employee Reimbursement Mobile Application

**Version:** 1.1\
**Status:** Updated Draft\
**Date:** 23 August 2026 **Product:** Claim Desk\
**Product Type:** Internal Mobile-First Employee Reimbursement
Application\
**Industry:** Audit / Professional Services

## 1. Purpose

Specify the functional behavior of Claim Desk, with the
employee/approver mobile application as the primary product and the
Finance/Admin web portal as the supporting operational interface.

## 1.1 Functional Product Boundary

### Claim Desk Mobile Application

-   Expense capture
-   Receipt scan/gallery upload
-   OCR confirmation
-   Draft expense management
-   Claim creation and submission
-   Claim tracking
-   Manager/engagement manager/partner approvals
-   Notifications
-   Employee profile

### Finance/Admin Web Portal

-   Finance verification
-   Payment processing
-   Master data
-   Policy configuration
-   Approval workflow configuration
-   Reports
-   Audit logs
-   Access administration

Unless explicitly stated otherwise, employee and approver functions are
mobile requirements.

## 2. Functional Actors

  Actor                       Functional Access
  --------------------------- ---------------------------------------------------
  Employee                    Own expenses and claims
  Reporting Manager           Assigned approval requests
  Engagement Manager          Assigned engagement approvals
  Partner / Senior Approver   Assigned high-value/exception approvals
  Finance                     Approved claims, verification, payment
  Admin                       Masters, policies, workflows, roles/configuration
  Auditor / Read-only         Authorized records and audit history

A user may hold multiple roles.

## 3. Functional Entities

Core entities:

-   User
-   Employee
-   Organization
-   Branch
-   Department
-   Employee Grade
-   Client
-   Engagement
-   Engagement Assignment
-   Expense Category
-   Expense Subcategory
-   Expense
-   Expense Attachment
-   Receipt Extraction
-   Expense Policy
-   Policy Rule
-   Policy Evaluation
-   Claim
-   Claim Expense
-   Approval Workflow
-   Workflow Rule
-   Approval Instance
-   Approval Action
-   Finance Verification
-   Payment Batch
-   Payment
-   Notification
-   Comment
-   Audit Event

## 4. Authentication

### FR-AUTH-001

The system shall authenticate users through the configured
organizational authentication mechanism.

### FR-AUTH-002

The system shall map the authenticated identity to an active
employee/user record.

### FR-AUTH-003

Inactive users shall not create or approve new transactions.

### FR-AUTH-004

Authorization shall be evaluated independently of authentication.

## 5. Employee Profile

### FR-PRO-001

The employee shall be able to view: - Employee ID - Name - Email -
Mobile where available - Department - Branch - Designation/grade -
Reporting manager

### FR-PRO-002

Sensitive finance/payment attributes shall be displayed according to
permissions and masking rules.

## 6. Expense Creation

### FR-EXP-001

Employee shall create an expense through: - Receipt scan - Gallery/file
upload - Manual entry - Mileage entry

### FR-EXP-002 --- Expense Fields

  -----------------------------------------------------------------------
  Field                   Required                Notes
  ----------------------- ----------------------- -----------------------
  Expense Date            Yes                     Cannot violate
                                                  configured future-date
                                                  rules

  Merchant                Conditional             May be optional for
                                                  mileage/defined
                                                  categories

  Category                Yes                     Active categories only

  Subcategory             Conditional             Based on category

  Amount                  Yes                     \> 0

  Currency                Yes                     Supported currency

  Classification          Yes                     Billable / Non-Billable
                                                  / Internal

  Client                  Conditional             Required for client
                                                  classifications

  Engagement              Conditional             Required for client
                                                  classifications

  Business Purpose        Yes                     Length/configuration
                                                  validation

  Receipt                 Conditional             Policy driven

  Tax/Invoice Number      Optional/Conditional    Based on
                                                  category/jurisdiction

  GSTIN                   Optional/Conditional    Validation where
                                                  applicable

  Justification           Conditional             Required for policy
                                                  exception
  -----------------------------------------------------------------------

### FR-EXP-003

Expense amount must be positive and use configured monetary precision.

### FR-EXP-004

Client Billable and Client Non-Billable expenses shall trigger
client/engagement validation.

### FR-EXP-005

The system shall prevent the same expense from being actively included
in more than one claim.

### FR-EXP-006

Draft expenses may be edited by their owner subject to permissions.

## 7. Receipt and OCR

### FR-OCR-001

The mobile application shall allow receipt capture using the device
camera.

### FR-OCR-002

The system shall preserve the original uploaded receipt.

### FR-OCR-003

OCR shall attempt extraction of: - Merchant - Invoice/receipt number -
Date - Amount - Currency - GSTIN - Tax values

### FR-OCR-004

Extracted data shall be presented for user confirmation.

### FR-OCR-005

OCR failure shall not prevent manual expense creation unless a specific
policy requires machine validation.

### FR-OCR-006

The system shall record OCR confidence/provider metadata where
available.

## 8. Duplicate Detection

### FR-DUP-001

The system shall evaluate potential duplicates during expense creation
and submission.

Potential signals: - Same employee - Same date - Same amount - Same
merchant - Same invoice number - Same/similar receipt fingerprint

### FR-DUP-002

Potential duplicates shall be displayed to the employee and/or reviewer.

### FR-DUP-003

Duplicate behavior shall be configurable as warning or blocking
validation.

## 9. Client and Engagement

### FR-ENG-001

Only active clients shall be selectable.

### FR-ENG-002

Only engagements valid for the selected client shall be selectable.

### FR-ENG-003

The application should restrict engagement choices based on employee
assignment when configured.

### FR-ENG-004

Closed engagements shall not accept new expenses unless explicitly
permitted.

## 10. Policy Engine

### FR-POL-001

The system shall evaluate applicable policy rules when relevant expense
data changes and again at submission.

### FR-POL-002

Policy evaluation outcomes:

``` text
PASS
WARNING
EXCEPTION
BLOCK
```

### FR-POL-003

Each result shall contain: - Rule identifier - User-facing message -
Severity - Expected/allowed value where relevant - Actual value -
Required action

### FR-POL-004

EXCEPTION may require employee justification.

### FR-POL-005

BLOCK shall prevent submission until resolved.

### FR-POL-006

Policy version used during submission shall be retained for
auditability.

## 11. Mileage

### FR-MIL-001

Mileage expense shall capture: - Date - Origin - Destination -
Distance - Unit - Rate - Calculated amount - Purpose - Client/engagement
where applicable

### FR-MIL-002

Applicable mileage rate shall be selected from effective policy
configuration.

### FR-MIL-003

Calculated reimbursement shall be displayed before saving.

## 12. Claim Creation

### FR-CLM-001

Employee shall create a claim from eligible unclaimed expenses.

### FR-CLM-002

Claim fields:

  Field                Required
  -------------------- ---------------------------
  Claim ID/Number      System generated
  Claim Title          Yes
  Employee             System generated
  Expense Lines        Yes, at least one
  Claimed Total        System calculated
  Reimbursable Total   System/Finance calculated
  Currency             Yes
  Declaration          Yes at submission
  Submission Date      System generated
  Status               System managed

### FR-CLM-003

Claim total shall be calculated from included expense lines and must not
rely on a user-entered total.

### FR-CLM-004

Submission shall trigger final validations and workflow resolution
atomically from a business perspective.

### FR-CLM-005

If blocking validation fails, the claim remains unsubmitted and errors
are shown.

## 13. Claim Statuses

Supported baseline statuses:

``` text
DRAFT
SUBMITTED
IN_APPROVAL
RETURNED
REJECTED
APPROVED
FINANCE_REVIEW
VERIFIED
PAYMENT_PROCESSING
PAID
WITHDRAWN
CANCELLED
```

Status transitions shall be governed by permissions and workflow rules.

## 14. Approval Workflow

### FR-APR-001

On submission, the workflow engine shall resolve the required approval
path.

### FR-APR-002

Routing criteria may include: - Employee - Reporting hierarchy -
Amount - Category - Classification - Client - Engagement - Department -
Grade - Policy exception

### FR-APR-003

The system shall support sequential approval stages.

### FR-APR-004

Future-compatible design should allow parallel approval stages.

### FR-APR-005

Approver actions: - Approve - Return - Reject - Comment

### FR-APR-006

Return and Reject require a reason.

### FR-APR-007

The system shall prevent unauthorized self-approval.

### FR-APR-008

Approval action shall record actor, action, timestamp, comment/reason,
stage and workflow version.

### FR-APR-009

Once the final required approver approves, claim status shall progress
to Finance Review.

## 15. Approval Delegation and Escalation

### FR-DEL-001

Authorized users/admins may configure approval delegation with effective
start/end dates.

### FR-DEL-002

Delegation shall be recorded in approval history.

### FR-ESC-001

Pending approvals may generate reminders based on SLA configuration.

### FR-ESC-002

Escalation may notify or reroute according to configured workflow rules.

## 16. Finance Verification

### FR-FIN-001

Finance queue shall show fully approved claims awaiting verification.

### FR-FIN-002

Finance shall view: - Claim - Expense lines - Receipts - OCR
information - Policy evaluation - Employee justification - Approval
history - Client/engagement

### FR-FIN-003

Finance may maintain authorized accounting fields including: -
GL/account code - Cost center - Tax treatment - Reimbursable amount -
Finance notes

### FR-FIN-004

Any finance adjustment affecting employee reimbursement shall require
traceability and, where configured, a reason/reapproval.

### FR-FIN-005

Finance may: - Verify - Return for correction - Hold

### FR-FIN-006

Verified claims become eligible for payment.

## 17. Payment

### FR-PAY-001

Authorized finance users shall create payment batches from eligible
verified claims.

### FR-PAY-002

Payment record fields: - Payment ID - Claim ID - Employee - Amount -
Currency - Payment method - Payment date - Payment reference - Batch
reference - Status

### FR-PAY-003

A claim shall be marked PAID only after successful payment
confirmation/manual authorized confirmation.

### FR-PAY-004

Payment status changes shall be audited.

### FR-PAY-005

The system shall prevent accidental duplicate payment processing through
appropriate uniqueness/idempotency controls.

## 18. Notifications

### FR-NOT-001

Notifications shall be generated for configured workflow events.

### FR-NOT-002

Notification shall contain sufficient context without exposing sensitive
information unnecessarily.

### FR-NOT-003

Users shall be able to navigate from supported notifications to the
relevant claim/approval.

### FR-NOT-004

Notification delivery failures shall not alter financial workflow state.

## 19. Search and Filtering

Users shall be able to filter according to role and permissions by
fields such as: - Claim number - Employee - Status - Date range -
Amount - Category - Client - Engagement - Department - Policy
exception - Payment status

## 20. Reports

### FR-REP-001

Reports shall respect authorization scope.

### FR-REP-002

Initial reports: - Employee reimbursements - Claim status - Pending
approvals - Approval aging - Category spend - Client spend - Engagement
spend - Billable/non-billable spend - Policy exceptions - Finance
pending - Payment status

### FR-REP-003

Authorized users should be able to export supported reports to
spreadsheet-compatible formats.

## 21. Audit Trail

### FR-AUD-001

The system shall record auditable events for material business
operations.

### FR-AUD-002

Audit records shall contain where applicable: - Entity type - Entity
ID - Action - User - Timestamp - Old values - New values - Reason -
Correlation/request identifier

### FR-AUD-003

Normal application users shall not modify audit records.

### FR-AUD-004

Authorized reviewers shall be able to view chronological history.

## 22. Role and Permission Requirements

Permissions should be granular, e.g.:

``` text
expense:create
expense:read_own
expense:update_own_draft
claim:create
claim:submit
claim:withdraw
approval:read_assigned
approval:approve
approval:return
approval:reject
finance:review
finance:verify
payment:create_batch
payment:mark_paid
policy:manage
workflow:manage
report:view
report:export
audit:view
admin:manage
```

Roles shall map to permissions rather than relying solely on role-name
checks.

## 23. Validation and Error Handling

### FR-VAL-001

Validation errors shall identify the affected field and corrective
action.

### FR-VAL-002

Server-side validation is authoritative even when equivalent client-side
validation exists.

### FR-VAL-003

The system shall handle repeated submit/approve/payment requests safely
to reduce duplicate processing.

### FR-VAL-004

Concurrent actions shall not result in multiple valid approvals for the
same stage or duplicate payments.

## 24. File Handling

### FR-FIL-001

Supported receipt file types and maximum size shall be configurable.

### FR-FIL-002

Files shall be malware-scanned where infrastructure supports it.

### FR-FIL-003

Receipt access shall require authorization.

### FR-FIL-004

Replacing/removing attachments after submission shall follow controlled
workflow rules and be audited.

## 25. Security Requirements

-   Encryption in transit
-   Encryption at rest for sensitive storage
-   RBAC/permission enforcement server-side
-   Secure receipt/document access
-   Session/token controls
-   Least-privilege administration
-   Audit logging
-   Protection against IDOR/access to another employee's records
-   Secrets kept outside application source

## 26. Performance Expectations

Targets to validate during architecture/performance planning:

-   Common mobile screens should feel responsive under normal network
    conditions.
-   Standard API reads should target sub-second server processing where
    practical.
-   Receipt upload/OCR may be asynchronous.
-   Long-running exports and integration operations should use
    background processing.

## 27. Edge Cases

The product shall explicitly handle:

1.  OCR cannot read receipt.
2.  Receipt contains multiple totals.
3.  Expense currency differs from reimbursement currency.
4.  Receipt is missing.
5.  Expense exceeds policy.
6.  Expense appears duplicated.
7.  Engagement closes before claim submission.
8.  Approver leaves organization.
9.  Approver is the claimant.
10. Claim is returned after one or more approvals.
11. Policy changes after expense creation.
12. Employee changes department/manager after submission.
13. Finance changes reimbursable amount.
14. Payment fails.
15. Payment API times out after bank accepted transaction.
16. User submits twice due to poor network.
17. Receipt upload succeeds but OCR fails.
18. Client/engagement master becomes inactive.
19. Employee leaves before reimbursement is processed.
20. Claim contains expenses from multiple engagements.

## 28. Functional Acceptance Scenario

``` text
Given an active employee assigned to Client ABC / Engagement FY26 Audit
And the employee incurs a ₹1,850 eligible travel expense
When the employee scans the receipt
Then OCR extracts available receipt data
And the employee confirms the amount/category
And selects Client ABC / FY26 Audit
And classifies it as Client Billable
And policy validation passes
And the employee adds the expense to a claim
And submits the claim
Then the configured Engagement Manager receives the approval
When the manager approves
Then Finance receives the claim
When Finance verifies and processes payment
Then the claim becomes Paid
And the employee is notified
And every material action is present in the audit history.
```

## 29. Requirement Traceability Convention

Future stories/API/design artifacts should reference requirement IDs
such as:

``` text
BR-008 → Approval Routing
P-08   → Approval Inbox
FR-APR-001 → Resolve workflow on submission
FR-APR-005 → Approver actions
```

This allows BRD → PRD → FRD → User Story → API/Test traceability.

## 30. Open Functional Decisions

-   Can one claim contain multiple clients/engagements?
-   Is line-level approval required?
-   Is partial reimbursement supported?
-   Can an approver edit an expense or only return it?
-   Can finance override policy outcomes?
-   Does a finance amount change trigger reapproval?
-   How should foreign-exchange rates be sourced and locked?
-   What GST fields are mandatory?
-   What is the maximum receipt size/count?
-   How long are receipts/claims retained?
-   Is offline expense capture required?
-   What external system owns employee/client/engagement masters?
