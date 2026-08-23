# ADR-004 --- No Redis or BullMQ Initially

**Status:** Accepted \## Decision Do not deploy Redis/BullMQ. Use
MongoDB-backed job/outbox records for OCR, notification and integration
retries. \## Consequences Simpler operations; worker locking/retry
semantics must be implemented and load-tested.
