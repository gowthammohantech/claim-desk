# Claim Desk --- Data Model

**Version:** 1.0\
**Database:** MongoDB + Mongoose

## 1. Modeling Principles

-   References for independently governed aggregates; embed immutable
    snapshots that must survive master-data changes.
-   Monetary fields are integer paise.
-   UTC timestamps.
-   `createdBy`, `updatedBy`, `version` on mutable business aggregates.
-   Submitted claims and audit/payment history are not hard-deleted.

## 2. Core Collections

### employees

`_id, employeeCode, name, mobileNumber, email?, status, gradeId, departmentId, branchId, managerEmployeeId, paymentProfileMasked, externalHrId, roles[], createdAt, updatedAt`

### roles

`_id, code, name, permissions[], active`

### clients

`_id, code, name, status, externalId`

### engagements

`_id, code, clientId, name, status, startDate, endDate, managerEmployeeId, partnerEmployeeId, memberEmployeeIds[], costCentreId, externalId`

### expenseCategories

`_id, code, name, active, defaultReceiptRequired, accountingDefaults`

### expenses

`_id, expenseNo, employeeId, captureMode, merchant, expenseDate, categoryId, amountPaise, currency, classification, clientId?, engagementId?, costCentreId?, businessPurpose, mileage?, receiptIds[], ocrResultId?, policyEvaluationId?, duplicateCaseIds[], exceptionJustification?, state, claimId?, version, createdAt, updatedAt`

`mileage = {origin, destination, distanceKm, ratePaisePerKm, rateRuleId, amountPaise}`

### receipts

`_id, expenseId, blobKey, fileName, mimeType, sizeBytes, sha256, uploadStatus, createdAt`

### ocrResults

`_id, receiptId, provider, providerRequestId, status, extracted, fieldConfidence, rawResponseRef?, startedAt, completedAt, error?`

### policyDefinitions

`_id, policyCode, version, name, priority, effectiveFrom, effectiveTo?, status, conditions, actions, createdBy, approvedBy?`

### policyEvaluations

`_id, expenseId, evaluatedAt, policyVersionIds[], contextSnapshot, results[], overallOutcome`

### duplicateCases

`_id, expenseId, candidateExpenseId, score, reasons[], status, resolution, resolutionReason?, resolvedBy?, resolvedAt?`

### claims

`_id, claimNo, employeeId, title, expenseIds[], totalPaise, currency, classificationSummary, clientEngagementSummary, status, declarationAcceptedAt, submittedAt?, policySnapshot, workflowSnapshot, currentStageIndex?, version, createdAt, updatedAt`

### approvalTasks

`_id, claimId, stageIndex, stageCode, assignedApproverId, originalApproverId?, delegatedFromId?, status, dueAt?, decision?, reason?, actedAt?, version`

### workflowDefinitions

`_id, workflowCode, version, name, priority, effectiveFrom, effectiveTo?, status, conditions, stages[]`

### delegations

`_id, delegatorEmployeeId, delegateEmployeeId, startAt, endAt, scope, status, createdBy`

### financeReviews

`_id, claimId, reviewerId, status, glAssignments[], gstReview, notes?, verifiedAt?, returnedAt?`

### paymentBatches

`_id, batchNo, status, claimIds[], totalPaise, paymentMethod, externalBatchId?, createdBy, createdAt, processedAt?`

### payments

`_id, claimId, paymentBatchId?, amountPaise, status, reference?, paidAt?, failureCode?, failureMessage?`

### notifications

`_id, recipientEmployeeId, type, title, body, entityType, entityId, channels[], readAt?, createdAt`

### auditEvents

`_id, eventId, eventName, entityType, entityId, actor, occurredAt, correlationId, requestId?, payload, before?, after?`

### outbox

`_id, eventType, aggregateType, aggregateId, payload, status, attempts, availableAt, lockedAt?, processedAt?, lastError?`

### integrationRuns

`_id, integration, direction, runType, status, startedAt, completedAt?, counters, errorSummary?`

## 3. Relationships

-   Employee 1:N Expense / Claim.
-   Client 1:N Engagement.
-   Engagement N:N Employee through assignment IDs.
-   Expense N:1 Claim only after attached to a claim.
-   Expense 1:N Receipt.
-   Claim 1:N ApprovalTask.
-   Claim 0:1 FinanceReview.
-   Claim 0:1 Payment.
-   PaymentBatch 1:N Payment/Claim.
-   Every material aggregate 1:N AuditEvent.

## 4. Critical Indexes

-   employees: unique `employeeCode`, unique normalized email.
-   expenses: `{employeeId, state, expenseDate}`, `{claimId}`, receipt
    hash support.
-   claims: unique `claimNo`, `{employeeId,status,submittedAt}`,
    `{status,submittedAt}`.
-   approvalTasks: `{assignedApproverId,status,dueAt}`, unique
    `{claimId,stageIndex,assignedApproverId}` where applicable.
-   policyDefinitions/workflowDefinitions:
    `{status,effectiveFrom,effectiveTo,priority}`.
-   auditEvents: `{entityType,entityId,occurredAt}`,
    `{actor.employeeId,occurredAt}`.
-   outbox: `{status,availableAt,lockedAt}`.
