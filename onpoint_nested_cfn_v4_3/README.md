# OnPointAI v3 Nested CloudFormation (ZIP contents)

## Files
- root.yaml (driver template)
- templates/dynamodb.yaml
- templates/messaging.yaml
- templates/lambdas.yaml
- templates/api.yaml
- deploy.sh

## Deploy steps (high level)
1) Pick an S3 bucket (ARTIFACT_BUCKET) for templates + lambda zips.
2) Upload your Lambda zip artifacts to:
   - s3://<bucket>/lambdas/onpoint-dev-ingress.zip
   - s3://<bucket>/lambdas/onpoint-dev-telematics-processor.zip
   - s3://<bucket>/lambdas/onpoint-dev-trip-summary-builder.zip
   - s3://<bucket>/lambdas/onpoint-trip-summary-api.zip
3) Run deploy.sh (uploads templates, then deploys root stack)

## Why checks should be downstream (your earlier question)
- Keep API fast + cheap, push heavier validation/routing to SQS/Kinesis consumers.
- You can still do *minimal* checks at the edge (max body size, auth, schema version).
