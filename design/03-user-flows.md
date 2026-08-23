# Claim Desk --- User Flows

**Version:** 1.0

## UF-01 Sign In

`Launch -> Firm SSO -> token validation -> employee/role/assignment load -> Home`
Failure: inactive employee, invalid audience/issuer, no Claim Desk
access.

## UF-02 Scan Receipt

`Home -> Scan -> Capture/Choose -> Upload -> OCR processing -> OCR Review -> Correct fields -> Classification -> Engagement if client -> Policy check -> Save Expense -> Expenses`

## UF-03 Manual Expense

`Home -> Manual -> Enter fields -> Attach receipt if required -> Classification -> Engagement -> Policy check -> Save -> Expenses`

## UF-04 Mileage

`Home -> Mileage -> Date/route/distance -> rate lookup -> amount calculation -> Classification -> Engagement -> Purpose -> Save`

## UF-05 Policy Exception

`Expense -> Policy violation -> Exception screen -> rule/limit/overage -> justification -> Save -> expense remains claimable with exception flag -> workflow may add Partner`

## UF-06 Duplicate

`Expense -> duplicate candidate -> Compare -> Discard OR Keep -> if Keep, reason/audit record -> continue`
A duplicate flag is not silently removed.

## UF-07 Create Claim

`Expenses -> select eligible unclaimed expenses -> Create Claim -> Review -> declaration -> submit`
Submission revalidates all lines and atomically snapshots
policy/workflow.

## UF-08 Returned Claim

`Notification/Claims -> Returned Claim -> return reason -> edit permitted expense/claim fields -> revalidate -> declaration -> resubmit`
Original submission/return history remains immutable.

## UF-09 Approve

`Push/Approvals -> Approval Detail -> evidence/exceptions -> Approve -> confirm -> next approval or Finance`
Approval may not be performed by the claimant.

## UF-10 Return

`Approval Detail -> Return -> required reason -> employee notified -> RETURNED -> employee corrects/resubmits`

## UF-11 Reject

`Approval Detail -> Reject -> required reason -> REJECTED -> terminal unless Admin-approved reopen capability is introduced later`

## UF-12 Finance Verify

`Finance Queue -> Claim Review -> accounting/GST/evidence -> Verify -> VERIFIED`
or `Return -> required reason -> RETURNED`.

## UF-13 Payment

`Verified claims -> Payment Batch -> export/API -> payment result -> record reference/date -> PAID -> notify employee`

## UF-14 Notifications

Domain event -\> notification preference/channel resolution -\> in-app
record + optional push/email -\> deep-link to claim/approval.

## UF-15 Delegation
Not required in the current scope.

## UF-16 Offline Draft

No network -\> employee may edit local draft -\> mark pending sync -\>
network restored -\> upload/validate -\> conflicts resolved server-side.
Submission/approval/payment require online server confirmation.
