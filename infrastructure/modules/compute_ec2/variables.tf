variable "name" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t4g.micro"
}

variable "key_name" {
  type        = string
  default     = null
  description = "Optional EC2 key pair name for SSH."
}

variable "user_data" {
  type        = string
  default     = null
  description = "Optional cloud-init script (install Node, etc.)."
}
