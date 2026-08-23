# ADR-007 — Mobile Number + OTP Authentication
**Status:** Accepted

## Decision
Claim Desk authenticates users using registered mobile number and OTP. The backend verifies the OTP and issues application access/refresh tokens.

## Current Implementation
OTP delivery/verification uses a dummy adapter for now.

## Consequences
No password or firm SSO dependency in the current scope. Mobile number maps to an active employee. OTP expiry, retry limits and abuse protection are required.
