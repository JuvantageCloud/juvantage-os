variable "name" {
  type        = string
  description = "Security group name, e.g. line-plaid-api-dev"
}

variable "app_port" {
  type        = number
  description = "App listen port (8787 for line-plaid-api)"
}

variable "ssh_cidr" {
  type        = string
  description = "Your public IP as CIDR, e.g. 1.2.3.4/32. Never 0.0.0.0/0 for SSH."
}

variable "vpc_id" {
  type        = string
  default     = null
  description = "Optional. Defaults to the account default VPC."
}
