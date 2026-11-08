data "aws_vpc" "default" {
  count   = var.vpc_id == null ? 1 : 0
  default = true
}

locals {
  vpc_id = coalesce(var.vpc_id, try(data.aws_vpc.default[0].id, null))
}

resource "aws_security_group" "this" {
  name        = var.name
  description = "Juvantage service ${var.name}"
  vpc_id      = local.vpc_id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "App port (phone / API testing)"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from operator IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = "juvantage"
    Name    = var.name
  }
}
