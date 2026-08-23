# Claim Desk --- Approval Workflow Specification

**Version:** 1.0

## 1. Objective

Resolve a deterministic, auditable approval route at claim submission
and execute it without changing historical routing when configuration
later changes.

## 2. Inputs

Claim total, employee/grade/branch/department, classifications,
client/engagement, engagement manager/partner, policy exception
severity, category flags, configured workflow version.

## 3. Baseline Route

  -----------------------------------------------------------------------
  Condition                           Route
  ----------------------------------- -----------------------------------
  Internal claim                      Reporting Manager -\> Finance

  Client claim, no exception, \<=     Engagement Manager -\> Finance
  ₹25,000                             

  Client claim \> ₹25,000             Engagement Manager -\> Partner -\>
                                      Finance

  Any configured material policy      Engagement Manager/Reporting
  exception                           Manager as applicable -\> Partner
                                      -\> Finance
  -----------------------------------------------------------------------

The ₹25,000 threshold is a baseline from current requirements/prototype
and must be configurable.

## 4. State Machine

-   DRAFT -\> SUBMITTED
-   SUBMITTED -\> IN_APPROVAL
-   IN_APPROVAL -\> IN_APPROVAL when another stage remains
-   IN_APPROVAL -\> APPROVED after final business approver
-   APPROVED -\> FINANCE_REVIEW
-   FINANCE_REVIEW -\> VERIFIED \| RETURNED
-   VERIFIED -\> PAYMENT_PROCESSING
-   PAYMENT_PROCESSING -\> PAID
-   IN_APPROVAL -\> RETURNED \| REJECTED
-   RETURNED -\> DRAFT/ready-for-resubmit through correction flow
-   DRAFT -\> CANCELLED when user cancels before resubmission
-   PAID and REJECTED are terminal in MVP.

## 5. Stage Schema

`stageCode, sequence, approverResolver, permission, required, slaHours, escalation, allowDelegation, decisionOptions`

Resolvers: `REPORTING_MANAGER`, `ENGAGEMENT_MANAGER`,
`ENGAGEMENT_PARTNER`, `NAMED_ROLE`, `NAMED_EMPLOYEE`.

## 6. Submission Algorithm

1.  Validate claim ownership and DRAFT state.
2.  Validate expense eligibility and ownership.
3.  Re-run policy/duplicate checks.
4.  Resolve active workflow version.
5.  Resolve every approver.
6.  Reject route if unresolved or claimant would approve self.
7.  Snapshot workflow + policy.
8.  Transition claim and create first approval task in one MongoDB
    transaction.
9.  Write audit/outbox records.
10. Notify current approver.

## 7. Decisions

Approve: reason optional unless policy says otherwise.\
Return: reason mandatory; employee may correct and resubmit.\
Reject: reason mandatory; terminal for MVP.

## 8. SLA/Escalation
Not required in the current scope.

## 9. Delegation
Not required in the current scope.

## 10. Concurrency

Decision endpoint requires current task version/state. First valid
terminal decision wins; stale attempts return HTTP 409.
