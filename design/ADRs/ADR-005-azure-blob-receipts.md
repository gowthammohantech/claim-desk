# ADR-005 --- Azure Blob for Receipt Binaries

**Status:** Accepted \## Decision Store receipt binaries in private
Azure Blob Storage; MongoDB stores metadata and references. \##
Consequences Use short-lived authorized access; validate type/size/hash;
do not store base64 receipt files in MongoDB.
