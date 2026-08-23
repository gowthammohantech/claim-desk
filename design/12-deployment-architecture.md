# Claim Desk --- Deployment Architecture

**Version:** 1.0\
**Cloud:** Microsoft Azure

## 1. Logical Topology

``` text
iOS/Android Expo App        React/Vite Finance Web
          |                         |
          +----------- HTTPS -------+
                       |
              Azure Front Door/WAF (recommended)
                       |
                Express TypeScript API
                       |
          +------------+-------------+
          |                          |
 MongoDB Atlas   Azure Blob Storage
          |
 Mongo job/outbox polling worker
          |
 Manual master-data / Dummy OCR / Accounting / Push adapters
```

## 2. Runtime

-   `api`: stateless Express container.
-   `worker`: same codebase or separate process for Mongo-backed
    OCR/outbox/retry work.
-   `web`: static React/Vite build via Azure Static Web Apps or
    Storage+CDN.
-   `mobile`: Expo/EAS build and enterprise/private distribution as
    selected by firm.

## 3. Azure Components

Recommended: Azure Container Apps for API/worker, Azure Blob Storage,
Key Vault, Application Insights/Azure Monitor, Front Door/WAF, private
networking where plan supports it. MongoDB hosting choice is open:
MongoDB Atlas on Azure or Azure Cosmos DB for MongoDB must be
benchmarked/confirmed before production.

## 4. Environments

DEV, TEST/UAT, PROD with isolated databases, storage containers, secrets
and identity registrations.

## 5. Scaling

API scales horizontally. Worker uses lease/lock fields in Mongo jobs to
prevent duplicate execution. Blob direct upload may use short-lived SAS
URLs after API authorization.

## 6. Security

application token validation after mobile-number OTP authentication, TLS only, WAF/rate limits, Key Vault, managed
identities where possible, encrypted storage, restricted Blob access,
audit logs, least privilege.

## 7. Backup/DR

Database PITR/backup depends on selected Mongo service tier. Blob soft
delete/versioning recommended. Define production RPO/RTO before go-live.

## 8. CI/CD

PR -\> lint/typecheck/unit -\> build -\> integration tests -\>
artifact/image -\> deploy DEV -\> automated tests -\> UAT approval -\>
PROD. Mobile release pipeline separately signs/builds iOS/Android
packages.

## 9. Observability

Structured logs with correlation IDs, API latency/error rate, OCR/job
backlog, approval aging, integration failures, DB health, Blob failures
and deployment telemetry.
