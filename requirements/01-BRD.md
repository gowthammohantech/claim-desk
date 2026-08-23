# Business Requirements Document (BRD)

## Claim Desk --- Internal Employee Reimbursement Mobile Application

**Document Version:** 1.1\
**Status:** Updated Draft\
**Date:** 23 August 2026 **Product:** Claim Desk\
**Product Type:** Internal Mobile-First Employee Reimbursement
Application\
**Industry:** Audit / Professional Services

## 1. Purpose

Define the business requirements for an internal Claim Desk, an internal
employee reimbursement application for an audit firm. The system will
digitize employee expense capture, client/engagement allocation,
approvals, finance verification, reimbursement payment tracking, and
audit evidence.

## 2. Business Context

Audit employees frequently incur expenses while working at client
locations, travelling for engagements, attending meetings, or performing
internal activities. Manual reimbursement processes based on email,
paper receipts, spreadsheets, and disconnected approvals create delays,
weak visibility, duplicate submissions, policy violations, and
audit-control gaps.

Claim Desk will provide a mobile-first reimbursement experience for
employees and approvers, supported by a focused web portal for Finance
and Administration. The mobile application is the primary product
experience.

## 3. Business Objectives

-   Reduce reimbursement submission and processing time.
-   Allow employees to capture expenses and receipts immediately.
-   Associate applicable expenses with clients and engagements.
-   Distinguish client-billable, client-non-billable, and internal
    expenses.
-   Enforce configurable reimbursement policies.
-   Provide configurable approval workflows.
-   Improve finance verification and payment tracking.
-   Detect duplicate and potentially non-compliant claims.
-   Maintain a complete immutable audit trail.
-   Provide engagement-level expense visibility.
-   Establish structured data for future analytics and integrations.

## 4. Stakeholders

  -----------------------------------------------------------------------
  Stakeholder                         Responsibility
  ----------------------------------- -----------------------------------
  Employee                            Capture expenses and submit claims

  Reporting Manager                   Review employee/internal expenses

  Engagement Manager                  Review engagement-related expenses

  Partner                             Approve high-value or
                                      policy-exception claims

  Finance Team                        Verify, account, process and mark
                                      reimbursements paid

  Administrator                       Configure masters, policies,
                                      workflows and access

  Management                          Monitor expense trends, liabilities
                                      and engagement costs

  Internal Audit / Compliance         Review controls and historical
                                      activity
  -----------------------------------------------------------------------

## 5. Business Scope

### 5.1 In Scope --- Claim Desk Initial Product

-   Employee authentication and profile
-   Expense capture
-   Camera/gallery receipt attachment
-   OCR-assisted receipt extraction
-   Expense categorization
-   Client and engagement mapping
-   Billable/non-billable/internal classification
-   Mileage/local travel expenses
-   Expense claim/report creation
-   Submission and approval workflow
-   Approval delegation/escalation foundations
-   Policy validation and exception justification
-   Finance verification
-   Accounting classification fields
-   Reimbursement/payment status tracking
-   Employee and approver notifications
-   Finance/Admin web portal
-   Dashboard and operational reports
-   Complete audit trail
-   Role-based access control

### 5.2 Future Scope

-   Corporate card reconciliation
-   Travel booking integration
-   ERP/accounting integration
-   Bank/payment API integration
-   Automatic GL posting
-   Timesheet + expense engagement profitability
-   Advanced fraud/anomaly detection
-   AI-based categorization
-   GST input-tax eligibility automation
-   Multi-entity/global policy support
-   Offline-first expense capture

### 5.3 Out of Scope --- Initial Product

-   Payroll processing
-   Full accounting/ERP ledger
-   Client invoicing
-   Travel ticket booking
-   Vendor procurement
-   Employee attendance

## 5.4 Product Channel Boundary

**Claim Desk Mobile App** is the primary channel for employees and
approvers: - Expense and mileage capture - Receipt camera/gallery
upload - OCR review and correction - Client/engagement allocation -
Policy validation - Claim creation and submission - Approval actions -
Claim/payment tracking - Notifications

**Claim Desk Finance/Admin Web Portal** is the supporting channel for: -
Finance verification - Payment processing - Policy/workflow/master
administration - Reporting and audit review

## 6. Core Business Model

``` text
Organization
 ├── Employee
 ├── Client
 │    └── Engagement
 │         └── Assigned Employees
 ├── Expense Policy
 └── Approval Workflow

Employee
 └── Expense
      ├── Receipt(s)
      ├── Category
      ├── Client / Engagement (optional)
      ├── Expense Classification
      └── Policy Evaluation

Expense(s)
 └── Claim
      └── Approval Workflow
           └── Finance Verification
                └── Payment
```

## 7. Expense Classifications

Every expense must be classified as one of:

1.  **Client Billable** --- expected to be recovered from the client.
2.  **Client Non-Billable** --- engagement-related but borne by the
    firm.
3.  **Internal** --- unrelated to a client engagement.

Client-related classifications require a valid client and engagement
unless an authorized exception applies.

## 8. Expense Categories

Initial categories may include:

-   Air Travel
-   Train/Bus Travel
-   Taxi / Local Conveyance
-   Mileage
-   Accommodation
-   Meals
-   Parking
-   Toll
-   Client Meeting
-   Printing / Documentation
-   Communication / Internet
-   Office Supplies
-   Training / Certification
-   Software / Subscription
-   Employee Welfare
-   Other Business Expense

Categories and subcategories must be configurable.

## 9. Business Process

``` text
Employee incurs expense
        ↓
Capture expense + receipt
        ↓
OCR / manual data entry
        ↓
Select category + classification
        ↓
Select client/engagement when applicable
        ↓
Policy validation
        ↓
Save expense
        ↓
Add one or more expenses to Claim
        ↓
Submit Claim
        ↓
Approval workflow
        ↓
Finance verification
        ↓
Payment processing
        ↓
Marked Paid
        ↓
Audit history retained
```

## 10. Business Rules

### BR-001 --- Receipt Requirement

Receipt requirements shall be configurable by expense category and
amount threshold.

### BR-002 --- Client Expense Mapping

Client Billable and Client Non-Billable expenses shall normally require
Client and Engagement.

### BR-003 --- Policy Limits

Expense limits may vary by category, employee level, location,
engagement, travel type, or other configured criteria.

### BR-004 --- Policy Exceptions

An above-policy expense may be allowed with mandatory justification and
additional approval where configured.

### BR-005 --- Duplicate Detection

The system shall identify possible duplicate expenses using attributes
such as employee, date, merchant, amount, receipt, and invoice/reference
number.

### BR-006 --- Claim Submission

Only valid expenses that are not already part of another
submitted/processed claim may be submitted.

### BR-007 --- Submitted Claim Integrity

Employees cannot silently modify submitted claims. Changes require
return/withdrawal/revision according to configured rules and must be
audited.

### BR-008 --- Approval Routing

Approval routing shall be configurable and may depend on expense
classification, amount, employee, department, engagement, policy
exception, and hierarchy.

### BR-009 --- Self Approval

Users shall not approve their own reimbursement unless an explicit
authorized business rule permits it.

### BR-010 --- Finance Verification

Approved claims require finance verification before payment unless a
configured straight-through process applies.

### BR-011 --- Payment

A claim may be marked Paid only by an authorized role or integration.

### BR-012 --- Auditability

Create, edit, submit, withdraw, return, approve, reject, verify and
payment actions shall be auditable.

### BR-013 --- No Hard Delete

Financially relevant submitted records shall not be physically deleted
through normal application workflows.

### BR-014 --- Rejection/Return Reason

Rejecting or returning a claim requires a reason.

### BR-015 --- Currency

The system shall store original transaction currency and
reimbursement/base currency where applicable.

## 11. Approval Model

Illustrative default rules:

  -----------------------------------------------------------------------
  Condition                           Approval Path
  ----------------------------------- -----------------------------------
  Internal ≤ ₹5,000                   Reporting Manager → Finance

  Internal \> ₹5,000                  Reporting Manager →
                                      Partner/Authorized Approver →
                                      Finance

  Client-related                      Engagement Manager → Finance

  High-value client expense           Engagement Manager → Partner →
                                      Finance

  Policy exception                    Normal Approver(s) + Exception
                                      Approver → Finance
  -----------------------------------------------------------------------

Thresholds and routing are configuration, not hardcoded product
behavior.

## 12. Policy Management

Policies should support:

-   Category limits
-   Per-day/per-night limits
-   Receipt thresholds
-   Submission age limits
-   Mileage rates
-   Allowed categories
-   Employee-grade rules
-   Location/city rules
-   Domestic/international rules
-   Client/engagement-specific rules
-   Weekend/holiday warnings
-   Mandatory justification
-   Additional approval for exceptions

## 13. Finance Requirements

Finance must be able to:

-   Review approved claims
-   View original receipts
-   Validate tax/GST information
-   Correct permitted accounting classifications
-   Assign GL/account code
-   Assign cost center
-   Confirm reimbursable amount
-   Return claims for correction
-   Verify claims
-   Batch claims for payment
-   Record payment date/reference/method
-   Export reimbursement data

## 14. Audit and Compliance

The audit log should capture at minimum:

-   Entity and record ID
-   Action
-   Actor
-   Timestamp
-   Previous value
-   New value
-   Reason/comment where applicable
-   Workflow transition
-   Device/session metadata where appropriate and legally permitted

Historical approvals and evidence must remain retrievable according to
retention policy.

## 15. Reporting Requirements

Initial reports:

-   Claims by status
-   Employee expense report
-   Expense category report
-   Client expense report
-   Engagement expense report
-   Billable vs non-billable report
-   Policy exception report
-   Rejected/returned claims
-   Pending approval aging
-   Pending reimbursement liability
-   Payment report
-   Expense trend report

## 16. Non-Functional Business Expectations

-   Mobile-first employee experience
-   Secure access to financial and employee data
-   Fast receipt upload
-   High availability during normal business operations
-   Traceable business actions
-   Configurable rules without frequent code changes
-   Scalable to multiple branches/business units
-   Data retention aligned with firm policy and applicable regulation

## 17. Success Metrics

Potential KPIs:

-   Average expense-entry time
-   Average claim-to-approval time
-   Average approval-to-payment time
-   Percentage of expenses captured through mobile
-   Percentage of OCR fields accepted without correction
-   Policy exception rate
-   Duplicate claim detection rate
-   Returned/rejected claim rate
-   Claims pending beyond SLA

## 18. Assumptions / Open Business Decisions

-   Final approval thresholds require management confirmation.
-   Final expense categories require finance confirmation.
-   GST/tax treatment requires finance/tax-team confirmation.
-   Payment mechanism and accounting integration require confirmation.
-   Reimbursement currency rules require confirmation.
-   Retention period requires compliance confirmation.
-   Engagement master ownership/source system requires confirmation.
