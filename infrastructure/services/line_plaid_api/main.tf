# FIRST DEPLOY: Line bank API server (phone testing).
# Apply from this directory. Secrets values go in AWS Console — never here.

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "ssh_cidr" {
  type        = string
  description = "Operator public IP as CIDR, e.g. 1.2.3.4/32"
}

variable "key_name" {
  type        = string
  default     = null
  description = "Optional EC2 key pair for SSH"
}

variable "instance_type" {
  type    = string
  default = "t4g.micro"
}

locals {
  service_name = "line-plaid-api"
  app_port     = 8787
}

module "network" {
  source   = "../../modules/network"
  name     = "${local.service_name}-${var.env}"
  app_port = local.app_port
  ssh_cidr = var.ssh_cidr
}

module "secrets" {
  source = "../../modules/secrets"
  name   = "${local.service_name}/${var.env}/plaid"
}

module "compute" {
  source            = "../../modules/compute_ec2"
  name              = "${local.service_name}-${var.env}"
  security_group_id = module.network.security_group_id
  instance_type     = var.instance_type
  key_name          = var.key_name
  secret_arn        = module.secrets.secret_arn
  user_data = templatefile("${path.module}/../../modules/compute_ec2/templates/user_data.sh.tpl", {
    service_name = local.service_name
    secret_name  = module.secrets.secret_name
  })
}

module "service" {
  source       = "../../modules/service_node"
  service_name = local.service_name
  app_port     = local.app_port
}

output "server_ip" {
  value       = module.compute.public_ip
  description = "Point phone / LinePlaidConfig at http://SERVER_IP:8787"
}

output "instance_id" {
  value = module.compute.instance_id
}

output "secret_arn" {
  value = module.secrets.secret_arn
}

output "secret_name" {
  value = module.secrets.secret_name
}

output "systemd_unit_to_install" {
  value = module.service.systemd_unit
}
