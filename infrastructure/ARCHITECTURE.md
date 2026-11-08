# Juvantage Cloud — org infrastructure architecture

**Status:** Terraform files only. Nothing has been `terraform apply`’d.
No AWS resources from this repo. No GitHub `juvantagecloud` org yet.

## Goal

One AWS footprint for **Juvantage Cloud**:

| Product | Service | Runtime |
|---------|---------|---------|
| Line (banking) | `line-plaid-api` | Node on EC2 |
| OS Brain | `os-brain` | Same pattern (stub; phase 3) |

Pattern: **modules → service root → one small EC2 + Secrets Manager + SG**. No Fly. No ASG yet.

## Target diagram (after first apply)

```
                    Internet (phone / Link / Sync)
                              |
                              v
                     [ EIP :8787 / :443 ]
                              |
              +---------------+----------------+
              |  EC2 t4g.micro (AL2023 ARM)    |
              |  systemd → node dist/index.js  |
              |  IAM → SSM + Secrets Manager   |
              +---------------+----------------+
                              |
                              v
                    Secrets Manager
                 (PLAID_CLIENT_ID / SECRET)
                              |
                              v
                         Plaid API
```

Phone → EIP → Express (`line-plaid-api`) → Plaid. Secrets never in the iOS app or git.

## On disk

```
infrastructure/
  ARCHITECTURE.md
  README.md
  modules/
    network/          SG: 443, app port, SSH from your IP
    compute_ec2/      AL2023 ARM, EIP, SSM + optional secret read
    secrets/          Secrets Manager placeholder
    service_node/     systemd unit text
  services/
    line_plaid_api/   ← apply root (first deploy)
    os_brain/         stub
  envs/
    dev/              how to run with env=dev
    prod/             how to run with env=prod
```

## Locked choices

- Region: `us-east-1`
- Compute: `t4g.micro` Amazon Linux 2023 ARM
- Secrets: Manager (placeholder in TF; real values in Console)
- SSH: your public IP `/32` only
- OS Brain: same host / second systemd unit first (see ORG_INFRA.md)

## Not deployed

- No EC2, EIP, SG, or secrets in AWS from this folder
- Apply waits on: AWS account + CLI + Terraform + `ssh_cidr` in tfvars

## First apply (when ready)

```bash
cd services/line_plaid_api
cp terraform.tfvars.example terraform.tfvars   # set ssh_cidr
terraform init && terraform plan
terraform apply
# then: put real Plaid keys in Secrets Manager, install app, enable systemd
```
