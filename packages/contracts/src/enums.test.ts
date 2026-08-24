import { describe, expect, it } from 'vitest';
import * as c from './index.js';

/**
 * Locks the size of every enum against the design docs. A careless edit that
 * adds or drops a member fails here rather than silently diverging from the
 * spec.
 */
describe('contract enum sizes match the design docs', () => {
  const cases: ReadonlyArray<readonly [string, readonly string[], number, string]> = [
    ['ClaimStatus', c.CLAIM_STATUSES, 11, 'design/08-workflow-spec.md §4'],
    ['ExpenseState', c.EXPENSE_STATES, 4, 'design/08-workflow-spec.md §4'],
    ['ApprovalTaskStatus', c.APPROVAL_TASK_STATUSES, 5, 'design/08-workflow-spec.md §4'],
    ['ApprovalDecision', c.APPROVAL_DECISIONS, 3, 'design/08-workflow-spec.md §4'],
    ['PolicyOutcome', c.POLICY_OUTCOMES, 4, 'design/09-policy-engine-spec.md'],
    ['CaptureMode', c.CAPTURE_MODES, 3, 'design/02-screen-inventory.md'],
    ['Classification', c.CLASSIFICATIONS, 3, 'design/04-data-model.md'],
    ['ApproverResolver', c.APPROVER_RESOLVERS, 5, 'design/08-workflow-spec.md §5'],
    ['PolicyOperator', c.POLICY_OPERATORS, 10, 'design/09-policy-engine-spec.md §3'],
    ['PolicyActionType', c.POLICY_ACTION_TYPES, 9, 'design/09-policy-engine-spec.md §4'],
    ['DuplicateResolutionAction', c.DUPLICATE_RESOLUTION_ACTIONS, 2, 'design/06-api-contract.yaml'],
    ['RoleCode', c.ROLE_CODES, 7, 'design/07-permission-matrix.md §1'],
    ['PermissionCode', c.PERMISSION_CODES, 16, 'design/07-permission-matrix.md §5'],
    ['AuditEventName', c.AUDIT_EVENT_NAMES, 35, 'design/10-audit-event-catalog.md §2'],
    ['OutboxEventType', c.OUTBOX_EVENT_TYPES, 8, 'requirements/TDD.md §15'],
    ['JobType', c.JOB_TYPES, 8, 'requirements/TDD.md §14'],
    ['EntityType', c.ENTITY_TYPES, 12, 'design/10-audit-event-catalog.md §2'],
    ['Currency', c.CURRENCIES, 1, 'gaps.md GAP-019 (INR only)'],
  ];

  it.each(cases)('%s has %i members (%s)', (_name, values, expected) => {
    expect(values).toHaveLength(expected);
    expect(new Set(values).size).toBe(expected);
  });

  it('audit event names follow domain.past_tense_action', () => {
    for (const name of c.AUDIT_EVENT_NAMES) {
      expect(name).toMatch(/^[a-z]+\.[a-z]+(_[a-z]+)*$/);
    }
  });

  it('permission codes are colon-separated lowercase', () => {
    for (const code of c.PERMISSION_CODES) {
      expect(code).toMatch(/^[a-z]+(:[a-z]+)+$/);
    }
  });
});
