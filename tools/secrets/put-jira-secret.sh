#!/usr/bin/env bash
# Puts Jira credentials from apps/api/.env into AWS Secrets Manager.
# Does not print secret values. Requires: aws CLI configured + JIRA_* in .env
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT}/apps/api/.env"
SECRET_NAME="${JUV_JIRA_SECRET_NAME:-juvantage/jos/jira}"
REGION="${AWS_REGION:-us-east-1}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
eval "$(grep -E '^JIRA_' "$ENV_FILE" | sed 's/\r$//')"
set +a

: "${JIRA_BASE_URL:?JIRA_BASE_URL missing in .env}"
: "${JIRA_EMAIL:?JIRA_EMAIL missing in .env}"
: "${JIRA_API_TOKEN:?JIRA_API_TOKEN missing in .env}"
: "${JIRA_PROJECT_KEY:?JIRA_PROJECT_KEY missing in .env}"

if ! command -v jq >/dev/null; then
  echo "jq required: brew install jq" >&2
  exit 1
fi

PAYLOAD=$(jq -n \
  --arg url "$JIRA_BASE_URL" \
  --arg email "$JIRA_EMAIL" \
  --arg token "$JIRA_API_TOKEN" \
  --arg key "$JIRA_PROJECT_KEY" \
  '{JIRA_BASE_URL:$url,JIRA_EMAIL:$email,JIRA_API_TOKEN:$token,JIRA_PROJECT_KEY:$key}')

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$PAYLOAD" \
    --region "$REGION" >/dev/null
  echo "Updated secret: $SECRET_NAME ($REGION)"
else
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Juvantage OS Jira API credentials — rotate via Atlassian + this script" \
    --secret-string "$PAYLOAD" \
    --region "$REGION" \
    --tags Key=Project,Value=juvantage Key=Component,Value=jira >/dev/null
  echo "Created secret: $SECRET_NAME ($REGION)"
fi

aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" \
  --query '{Name:Name,ARN:ARN,LastChanged:LastChangedDate}' --output table
