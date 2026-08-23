# ADR-009 --- Mongo Transactional Outbox

**Status:** Accepted \## Decision Material domain mutation and its
outbox/audit records are written in the same MongoDB transaction where
supported. \## Consequences External side effects are retried safely;
consumers must be idempotent.
