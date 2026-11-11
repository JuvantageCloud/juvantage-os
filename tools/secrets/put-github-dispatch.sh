#!/usr/bin/env bash
# Create/update juvantage/jos/github-dispatch in AWS Secrets Manager.
# Usage: GITHUB_DISPATCH_TOKEN=xxx ./tools/secrets/put-github-dispatch.sh
set -euo pipefail
REGION="${AWS_REGION:-us-east-1}"
SECRET_NAME="${JUV_GITHUB_DISPATCH_SECRET_NAME:-juvantage/jos/github-dispatch}"
: "${GITHUB_DISPATCH_TOKEN:?Set GITHUB_DISPATCH_TOKEN in the environment (do not commit it)}"
PAYLOAD=$(jq -n --arg t "$GITHUB_DISPATCH_TOKEN" '{GITHUB_DISPATCH_TOKEN:$t}')
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws secretsmanager put-secret-value --secret-id "$SECRET_NAME" --secret-string "$PAYLOAD" --region "$REGION" >/dev/null
  echo "Updated $SECRET_NAME"
else
  aws secretsmanager create-secret --name "$SECRET_NAME" --secret-string "$PAYLOAD" --region "$REGION" \
    --tags Key=Project,Value=juvantage Key=Component,Value=github-dispatch >/dev/null
  echo "Created $SECRET_NAME"
fi
aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" \
  --query '{Name:Name,ARN:ARN}' --output table
