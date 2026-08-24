import { ClaimStatus, PolicyOutcome } from '@claimdesk/contracts';

/**
 * Semantic colour roles used by chips, callouts and badges.
 *
 * Mapping follows the prototype: green = within policy / verified / paid,
 * amber = policy exception, red = duplicate / reject / return,
 * violet = smart check, blue = in-flight, neutral = draft / terminal-inactive.
 */
declare const TONES: readonly ["neutral", "accent", "ok", "warn", "danger", "violet"];
type Tone = (typeof TONES)[number];
declare const claimStatusTone: (status: ClaimStatus) => Tone;
declare const policyOutcomeTone: (outcome: PolicyOutcome) => Tone;
/** Human label for a claim status. Terminology must match across web and mobile (PRD §13). */
declare const claimStatusLabel: (status: ClaimStatus) => string;

export { TONES, type Tone, claimStatusLabel, claimStatusTone, policyOutcomeTone };
