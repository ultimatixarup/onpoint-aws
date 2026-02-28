# OnPoint Route53 & Preconfigured Environment Domains Requirements

## 1. Purpose
This document defines authoritative requirements for DNS and domain management using Amazon Route 53 for all OnPoint environments.

The objective is to ensure each environment (`dev`, `test`, `prod`) has preconfigured, stable, and predictable domain names for UI and APIs, with no manual DNS edits during normal deployments.

---

## 2. Scope
In scope:
- Route 53 hosted zone architecture
- Environment domain naming standards
- TLS certificate and alias requirements
- CloudFormation/deployment parameterization
- Promotion and rollback behavior

Out of scope:
- Registrar transfer process
- Non-AWS DNS providers

---

## 3. Normative Language
The key words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are to be interpreted as mandatory requirement levels.

---

## 4. Required DNS Architecture

### 4.1 Hosted Zones
1. The platform **MUST** use Route 53 as the authoritative DNS provider.
2. A parent hosted zone **MUST** exist for the primary domain (example: `onpoint.example.com`).
3. Environment subdomains **MUST** be pre-created as records under the parent zone.
4. DNS changes for application endpoints **MUST** be managed by IaC (CloudFormation), not manual console edits.

### 4.2 Environment Domains (Preconfigured)
The following environment domains **MUST** be reserved and configured:
- `dev.<root-domain>`
- `test.<root-domain>`
- `prod.<root-domain>` (or apex `<root-domain>` if approved)

Example with root `onpoint.example.com`:
- `dev.onpoint.example.com`
- `test.onpoint.example.com`
- `prod.onpoint.example.com`

### 4.3 Service Subdomains
Each environment **MUST** include preconfigured aliases at minimum for:
- UI: `app.<env>.<root-domain>`
- API Gateway entrypoint: `api.<env>.<root-domain>`

Optional service aliases (recommended):
- `ingest.<env>.<root-domain>`
- `geofence.<env>.<root-domain>`
- `vehicle.<env>.<root-domain>`
- `fleet.<env>.<root-domain>`

---

## 5. TLS & Certificate Requirements
1. All public endpoints **MUST** be HTTPS-only.
2. ACM certificates **MUST** be provisioned before endpoint cutover.
3. UI CloudFront custom-domain certificates **MUST** be in `us-east-1`.
4. API custom-domain certificates **MUST** be in the API region.
5. Certificate validation **MUST** be DNS-based via Route 53 records managed by IaC.

---

## 6. Infrastructure as Code Requirements
1. Root stack **MUST** accept domain parameters for each environment:
   - `RootDomainName`
   - `EnvSubdomain` (`dev|test|prod`)
   - `HostedZoneId`
2. UI nested stack **MUST** support:
   - custom domain name
   - ACM ARN
   - hosted zone ID
   - automatic alias record creation
3. API stack(s) **MUST** support custom-domain and base-path mappings via IaC.
4. Deployment scripts **MUST** support UI-only DNS/domain deployment without requiring full backend redeploy.
5. Re-running deployment **MUST** be idempotent.

---

## 7. Operational Requirements
1. Domain names for `dev`, `test`, and `prod` **MUST** be immutable once published, except through formal change approval.
2. DNS TTL for alias records **SHOULD** be low (e.g., 60 seconds) for controlled cutovers.
3. Rollback **MUST** preserve prior DNS targets or support immediate re-pointing using IaC parameters.
4. Environment isolation **MUST** prevent test traffic from resolving to production endpoints.

---

## 8. Security & Governance
1. Route 53 changes **MUST** be restricted to deployment roles.
2. Manual DNS updates in production **MUST NOT** be the default process.
3. All DNS and certificate changes **MUST** be auditable via CloudTrail and deployment logs.

---

## 9. Acceptance Criteria
The requirement is accepted when all of the following are true:
1. `dev`, `test`, and `prod` domains resolve correctly without manual record creation after stack deployment.
2. UI in each environment is reachable at `app.<env>.<root-domain>` over valid HTTPS.
3. API in each environment is reachable at `api.<env>.<root-domain>` over valid HTTPS.
4. CloudFormation outputs include resolved UI and API URLs for each environment.
5. Re-deploying the same stack results in no destructive DNS side effects.

---

## 10. Implementation Guidance (Recommended)
- Maintain one canonical domain configuration file per environment under deployment config.
- Keep all domain and certificate parameters in environment-specific config files.
- Add a preflight check in deploy scripts to validate:
  - hosted zone exists
  - certificate status is `ISSUED`
  - required aliases are present or creatable

---

## 11. Summary
- Route 53 is mandatory and authoritative.
- `dev`, `test`, and `prod` domains are preconfigured and stable.
- UI and API custom domains are IaC-managed and HTTPS-only.
- Deployments are idempotent and environment-isolated.
