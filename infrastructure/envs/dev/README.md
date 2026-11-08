# env = dev

Cheap test stack. Break it freely.

```bash
cd ../../services/line_plaid_api
cp terraform.tfvars.example terraform.tfvars   # set ssh_cidr
# edit: env = "dev"
terraform init && terraform plan
# terraform apply   # only when AWS CLI + credentials are ready
```

Plaid: `PLAID_ENV=sandbox` in Secrets Manager.
