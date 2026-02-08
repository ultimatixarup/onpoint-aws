# UI Deployment (Serverless)

## Overview
This repository provisions a **serverless UI** (S3 + CloudFront + OAC) as an **optional** nested stack. It is disabled by default to avoid impacting existing stacks.

## Enable the UI Nested Stack
Use the UI deploy helper to enable the UI resources safely:

```
./scripts/deploy_ui_stack.sh <cfn-bucket> \
  --region us-east-1 \
  --stack-name onpoint-dev \
  --env dev \
  --project-name onpoint \
  --prefix cfn \
  --template-version v1
```

Optional custom domain:

```
./scripts/deploy_ui_stack.sh <cfn-bucket> \
  --ui-custom-domain ui.example.com \
  --ui-acm-arn arn:aws:acm:us-east-1:123456789012:certificate/abc \
  --ui-hosted-zone-id Z123456ABCDEFG
```

## Deploy UI Assets
Build and publish the SPA assets to the UI bucket:

```
./scripts/deploy_ui_assets.sh <ui-bucket-name> <cloudfront-distribution-id>
```

Notes:
- The script defaults to **ui/**. If your UI lives in **src-ui/**, it will auto-detect it.
- Immutable assets under /assets are uploaded with long cache + immutable.
- index.html and config.json are uploaded with no-cache headers.

## Runtime Configuration
The UI reads configuration at runtime from **/config.json**. This avoids rebuilds when environments change.

### Expected keys
```json
{
  "apiBaseUrl": "https://api.example.com",
  "tripSummaryBaseUrl": "https://api.example.com/trip-summary",
  "vehicleStateBaseUrl": "https://api.example.com/vehicle-state",
  "featureFlags": {
    "enableTelemetry": true,
    "enableTripMap": true
  },
  "tenantMode": "switcher"
}
```

- `apiBaseUrl`: default API gateway base
- `tripSummaryBaseUrl`, `vehicleStateBaseUrl`: service-specific endpoints
- `featureFlags`: boolean feature toggles
- `tenantMode`: `switcher` (single-domain) or `subdomain` (future)

## Validation
- `aws cloudformation validate-template` should pass for root and nested UI template.
- `pre-commit run -a` should pass.
- With `EnableUiStack=false`, updates should be no-ops.
