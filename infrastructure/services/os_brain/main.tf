# Juvantage OS Brain API (hosted). Same modules as line_plaid_api. Do not apply until
# Line EC2 exists OR you intentionally stand up OS-only.
#
# Go-live path (ORG_INFRA + docs/SECRETS_AND_DEPLOY.md):
#   1. Dogfood Brain locally (localhost:3001) for product phases
#   2. Apply AWS dev: prefer same EC2 + second systemd unit "os-brain"
#   3. Point Desktop VITE_API_BASE_URL at the public/dev URL
#   4. Prod TF env + Secrets Manager + HTTPS + Google prod redirect URIs
#
# When ready:
#   - Copy line_plaid_api/main.tf, name = "os-brain", distinct app_port
#   - Secrets: JWT_SECRET, TOKEN_ENCRYPTION_KEY, GOOGLE_*, ANTHROPIC_*, DATABASE_URL
#
# See ../../ARCHITECTURE.md and docs/ORG_INFRA.md
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Intentionally empty until OS needs always-on Brain.
