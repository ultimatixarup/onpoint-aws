# OnPoint UI Architecture – Serverless Design Specification

## 1) Goals
- Deploy the React SPA as a **serverless static site** on AWS.
- Integrate UI infrastructure into the **existing nested CloudFormation** stack.
- Support **multi-tenant** routing and future custom domains.
- Provide secure, low‑latency global delivery with CDN caching.

## 2) Architecture Overview
**Pattern:** S3 (private) + CloudFront + Origin Access Control (OAC)

**High‑level flow:**
1. Build the SPA (`src-ui`) into static assets.
2. Upload build artifacts to a private S3 bucket.
3. CloudFront serves the assets globally.
4. SPA routing is handled via CloudFront custom error responses that map `403/404` to `/index.html`.

## 3) CloudFormation Integration
A new nested stack template is added at:
- cfn/nested/ui.yaml

The root stack includes:
- UiStack nested resource

### 3.1 Parameters (Root)
- `UiBucketName` (optional) — override the bucket name.
- `UiPriceClass` — CloudFront price class (default `PriceClass_100`).

### 3.2 Parameters (UI Nested)
- `Env`, `ProjectName`
- `UiBucketName`, `UiPriceClass`

### 3.3 Resources (UI Nested)
- **S3 Bucket** (private): stores SPA build output
- **CloudFront OAC**: secures S3 origin
- **CloudFront Distribution**: global CDN
- **S3 Bucket Policy**: grants CloudFront access to S3 objects

### 3.4 Outputs
- `UiBucketName`
- `UiBucketArn`
- `UiDistributionId`
- `UiCloudFrontDomainName`

## 4) Build & Deploy Flow
### 4.1 Build
```
cd src-ui
npm install
npm run build
```
Outputs:
- `src-ui/dist/`

### 4.2 Upload to S3
```
aws s3 sync src-ui/dist s3://<ui-bucket-name> --delete
```

### 4.3 Cache Invalidation (CloudFront)
```
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

## 5) Environment Configuration
The SPA reads API endpoints from Vite environment variables (example):
- `VITE_TRIP_SUMMARY_BASE_URL`
- `VITE_VEHICLE_STATE_BASE_URL`
- `VITE_ONPOINT_API_KEY`

For production, build with the **prod** .env values or CI‑injected env vars.

## 6) Security Considerations
- S3 bucket is **private** (no public access).
- CloudFront OAC is the only read path.
- TLS enforced by `ViewerProtocolPolicy: redirect-to-https`.
- Optional: add WAF in a future iteration.

## 7) SPA Routing Behavior
- `403` and `404` from S3 are rewritten to `/index.html`.
- React Router handles all client‑side routes.

## 8) Multi‑Tenant Domain Strategy (Future‑Ready)
Recommended options:
- **Single domain** with tenant switching in UI (current behavior).
- **Custom domains** per tenant via CloudFront alternate domain names.
- **Route53 + ACM** for SSL certs per tenant domain.

## 9) Observability & Operations
- CloudFront access logs (optional; add S3 log bucket if needed).
- S3 server access logs (optional).
- CI/CD should automate:
  1. `npm run build`
  2. `aws s3 sync`
  3. CloudFront invalidation

## 10) Serverless Framework Alignment
This design is **serverless** (managed AWS services). If you choose to wrap this with the Serverless Framework, create a `serverless.yml` that:
- Packages `src-ui/dist` to S3
- Creates the same CloudFront distribution/OAC
- Exposes the distribution domain as an output

The CloudFormation template in cfn/nested/ui.yaml is the authoritative source in this repo.
