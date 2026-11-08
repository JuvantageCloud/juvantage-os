variable "secret_arn" {
  type        = string
  default     = null
  description = "Optional Secrets Manager ARN the instance may read."
}

resource "aws_iam_role_policy" "secrets_read" {
  count = var.secret_arn == null ? 0 : 1
  name  = "${var.name}-secrets-read"
  role  = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = [var.secret_arn]
    }]
  })
}
