# OnPoint AWS

## Safe deployment loop

Run from scratch (first-time):

```bash
chmod +x scripts/bootstrap_artifacts_bucket.sh scripts/deploy_cfn.sh scripts/safe_redeploy.sh
./scripts/bootstrap_artifacts_bucket.sh onpoint-dev-cfn-artifacts --region us-east-1
./scripts/deploy_cfn.sh onpoint-dev-cfn-artifacts --region us-east-1 --stack-name onpoint-dev --env dev --project-name onpoint --prefix cfn
```

Run after every change:

```bash
pre-commit run -a
./scripts/safe_redeploy.sh onpoint-dev-cfn-artifacts --region us-east-1 --stack-name onpoint-dev --env dev --project-name onpoint --prefix cfn
```

Never delete stacks; redeploy via update-stack.
Nested templates must be uploaded to S3 first; stack references them from TemplateBucket/TemplatePrefix.
