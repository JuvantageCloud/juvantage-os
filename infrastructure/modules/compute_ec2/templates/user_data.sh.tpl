#!/bin/bash
set -euxo pipefail
dnf update -y
dnf install -y nodejs npm git
mkdir -p /opt/${service_name}
# App binary is copied/rsync'd after first apply. Secrets file created by operator:
#   aws secretsmanager get-secret-value --secret-id ${secret_name} --query SecretString --output text \
#     | jq -r 'to_entries|map("\(.key)=\(.value)")|.[]' > /etc/${service_name}.env
#   chmod 600 /etc/${service_name}.env
