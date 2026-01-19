# OnPointAI Lambdas (repo structure)

## Layout
- `lambdas/<name>/handler.py` - Lambda handler code
- `env/dev/<name>.json` - environment variables to deploy
- `shared/python/onpoint_common/...` - shared Lambda Layer code
- `scripts/` - packaging/deploy scripts

## Shared Layer
Publish the shared layer once:

```bash
./scripts/build_layer.sh
./scripts/publish_layer.sh onpoint-dev-shared-layer
```

Then attach the latest published layer version ARN to each function via the deploy scripts.

### Env files
Env JSONs live under `env/<env>/` and are applied via `scripts/deploy_lambda.sh`.

Included:
- env/dev/onpoint-dev-ingress.json
- env/dev/onpoint-dev-telematics-processor.json
- env/dev/onpoint-psl-enricher.json
- env/dev/onpoint-overspeed-detector.json
- env/dev/onpoint-dev-trip-summary-builder.json
- env/dev/onpoint-trip-summary-api.json

## Deploying CloudFormation

```bash
./deploy/scripts/deploy_all.sh deploy/config/dev.env
```
