# env = prod

Real users. PR + review before apply.
Use only after Plaid Production approval. Never sandbox-test here.

```bash
cd ../../services/line_plaid_api
# terraform.tfvars: env = "prod", ssh_cidr = your IP
terraform init && terraform plan
```
