# Claim Desk --- Audit Event Catalog

**Version:** 1.0

## 1. Event Envelope

Every event:
`eventId, eventName, entityType, entityId, actor{employeeId,role}, occurredAt, correlationId, requestId?, source, payload, before?, after?`.

## 2. Required Events

  ----------------------------------------------------------------------------
  Event                        Entity                  Minimum Payload
  ---------------------------- ----------------------- -----------------------
  auth.login_succeeded         employee                employeeId, provider

  auth.login_failed            identity                reason, provider

  expense.created              expense                 captureMode, amount,
                                                       category

  expense.updated              expense                 changedFields

  expense.deleted_draft        expense                 reason

  receipt.uploaded             receipt                 blobKeyHash, mimeType,
                                                       size

  ocr.started                  receipt                 provider

  ocr.completed                receipt                 confidence summary

  ocr.failed                   receipt                 provider, errorCode

  policy.evaluated             expense                 outcome,
                                                       matchedPolicies

  policy.exception_justified   expense                 policyCode, overage,
                                                       justification

  duplicate.detected           expense                 candidateId, score,
                                                       reasons

  duplicate.discarded          expense                 candidateId

  duplicate.kept               expense                 candidateId, reason

  claim.created                claim                   expenseIds, total

  claim.submitted              claim                   total, workflowVersion,
                                                       policyVersions

  claim.returned               claim                   stage, reason

  claim.rejected               claim                   stage, reason

  claim.resubmitted            claim                   previousSubmissionAt

  approval.assigned            approvalTask            stage, approver, dueAt


  approval.approved            approvalTask            stage

  approval.returned            approvalTask            reason

  approval.rejected            approvalTask            reason


  finance.review_started       claim                   reviewer

  finance.verified             claim                   accounting summary

  finance.returned             claim                   reason

  payment.batch_created        paymentBatch            claimIds, total

  payment.processing_started   payment                 amount

  payment.paid                 payment                 reference, paidAt

  payment.failed               payment                 errorCode

  notification.created         notification            type, channel

  policy.version_published     policy                  version, effectiveFrom

  workflow.version_published   workflow                version, effectiveFrom

  master.engagement_changed    engagement              changedFields

  access.role_changed          employee                oldRoles, newRoles
  ----------------------------------------------------------------------------

## 3. Rules

Audit data is append-only. Do not log receipt binary, access tokens,
full bank account numbers, or secrets. Sensitive free text is
access-controlled. Business mutations that require audit and outbox
should be committed in the same MongoDB transaction where supported.
