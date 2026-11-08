resource "aws_secretsmanager_secret" "this" {
  name        = var.name
  description = var.description
  tags        = { Project = "juvantage" }
}

# Empty placeholder so the secret exists. Put real JSON in AWS (not terraform.tfvars).
resource "aws_secretsmanager_secret_version" "placeholder" {
  secret_id     = aws_secretsmanager_secret.this.id
  secret_string = jsonencode({
    PLAID_CLIENT_ID = "REPLACE_IN_AWS_CONSOLE"
    PLAID_SECRET    = "REPLACE_IN_AWS_CONSOLE"
    PLAID_ENV       = "sandbox"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
