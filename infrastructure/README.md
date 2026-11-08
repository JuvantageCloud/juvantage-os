# infrastructure — Juvantage Cloud (Terraform)

**Why:** So we never ask "why is the server like this?" in 3 months.
All AWS for Line + Juvantage OS is created from here — not clicked by hand.

**Status:** Files only. Nothing applied to AWS yet. See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Map

| Path | Role |
|------|------|
| `modules/` | Reusable blocks (network, EC2, secrets, systemd helper) |
| `services/line_plaid_api/` | **First apply root** — Line bank API |
| `services/os_brain/` | Stub for later |
| `envs/dev`, `envs/prod` | How to set `env=` for each |

## Rules

1. Secrets NEVER in git — AWS Secrets Manager only
2. Only this folder creates AWS things
3. Change: edit → PR → review → merge → `terraform apply`

## First deploy (when AWS is ready)

```bash
cd services/line_plaid_api
cp terraform.tfvars.example terraform.tfvars
# set ssh_cidr = "YOUR.PUBLIC.IP/32"
terraform init && terraform plan
# terraform apply   # only when plan looks right
```

Outputs: `server_ip`, `secret_arn`, `systemd_unit_to_install`.

## Not built yet (on purpose)

No ASG, no ALB, no multi-AZ. One small server first.
