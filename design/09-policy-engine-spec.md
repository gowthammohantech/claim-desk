# Claim Desk --- Policy Engine Specification

**Version:** 1.0

## 1. Goal

Evaluate expense eligibility and controls deterministically without
embedding firm policy in mobile/web code.

## 2. Rule Model

``` json
{
  "policyCode": "POL-ACC-04",
  "version": 3,
  "priority": 100,
  "effectiveFrom": "2026-08-01T00:00:00Z",
  "conditions": {
    "all": [
      {"field": "category.code", "op": "EQ", "value": "ACCOMMODATION"},
      {"field": "employee.grade", "op": "IN", "value": ["M1","M2"]},
      {"field": "trip.domestic", "op": "EQ", "value": true}
    ]
  },
  "actions": [
    {"type": "LIMIT", "basis": "PER_NIGHT", "amountPaise": 400000},
    {"type": "REQUIRE_JUSTIFICATION_ON_EXCEED"},
    {"type": "ADD_APPROVAL_STAGE_ON_EXCEED", "resolver": "ENGAGEMENT_PARTNER"}
  ]
}
```

## 3. Supported Operators

`EQ, NE, IN, NOT_IN, GT, GTE, LT, LTE, EXISTS, BETWEEN`.

## 4. Context

Employee grade/branch/department, category, amount, date, merchant,
classification, client/engagement, receipt presence, mileage/distance,
trip attributes and duplicate signals.

## 5. Actions

ALLOW, BLOCK, WARN, REQUIRE_RECEIPT, LIMIT, REQUIRE_JUSTIFICATION,
MARK_EXCEPTION, ADD_APPROVAL_STAGE, SET_MILEAGE_RATE.

## 6. Precedence

1.  Explicit BLOCK.
2.  Mandatory legal/firm controls.
3.  More-specific rule over less-specific rule.
4.  Higher priority number.
5.  Newer effective version if still tied.
6.  Default category policy.

Multiple non-conflicting actions accumulate.

## 7. Outcomes

`PASS`, `WARNING`, `EXCEPTION_REQUIRES_JUSTIFICATION`, `BLOCKED`.

## 8. Evaluation Points

On expense create/update; after OCR confirmation; before adding to claim
if stale; mandatory re-evaluation at claim submission.

## 9. Snapshot

Submission stores matched policy versions, relevant input context,
results, limits and exception justifications. Later policy edits never
rewrite history.

## 10. Duplicate Policy

Duplicate detection is a smart check separate from the DSL scoring
implementation. Candidate score may use employee, merchant
normalization, amount, date proximity and receipt hash. User can discard
or keep with explanation; configurable rules may BLOCK unresolved
duplicates.

## 11. Example

Accommodation ₹5,500 against ₹4,000/night -\> exception ₹1,500 -\>
justification required -\> Partner stage added.
