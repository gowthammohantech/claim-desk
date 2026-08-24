import { describe, expect, it } from 'vitest';

import * as domain from './index.js';

/**
 * design/09-policy-engine-spec.md §1 requires policy to be evaluated
 * server-side "without embedding firm policy in mobile/web code". This package
 * ships to both clients, so anything on the list below appearing in its public
 * surface is a design violation, not a style preference.
 *
 * Clients consume policy OUTCOMES via POST /expenses/{id}/evaluate. They never
 * see the rules.
 */
const BACKEND_ONLY = [
  'evaluatePolicy',
  'matchPolicy',
  'resolveWorkflow',
  'resolveApprover',
  'scoreDuplicate',
  'detectDuplicates',
  'writeAudit',
  'appendOutbox',
  'emitAuditEvent',
];

describe('@claimdesk/domain public surface', () => {
  it('does not leak backend-only engines to the clients', () => {
    const exported = Object.keys(domain);
    for (const name of BACKEND_ONLY) {
      expect(exported).not.toContain(name);
    }
  });

  it('exports the helpers both clients rely on', () => {
    for (const name of [
      'formatPaise',
      'computeMileagePaise',
      'hasPermission',
      'cannotActOnOwnClaim',
      'canTransition',
      'expenseInputSchema',
    ]) {
      expect(domain).toHaveProperty(name);
    }
  });
});
