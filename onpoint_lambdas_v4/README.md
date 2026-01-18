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
