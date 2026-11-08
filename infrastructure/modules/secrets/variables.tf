variable "name" {
  type        = string
  description = "Secrets Manager name, e.g. line-plaid-api/dev/plaid"
}

variable "description" {
  type    = string
  default = "Juvantage service secrets — values set in AWS Console / CLI, never in git"
}
