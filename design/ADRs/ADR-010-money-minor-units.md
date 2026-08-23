# ADR-010 --- Money in Integer Minor Units

**Status:** Accepted \## Decision Store INR amounts as integer paise,
never floating-point currency. \## Consequences API fields use
`amountPaise`; UI formats rupees; mileage calculations round using a
documented rule.
