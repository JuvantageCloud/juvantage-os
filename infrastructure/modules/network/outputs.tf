output "security_group_id" {
  value = aws_security_group.this.id
}

output "vpc_id" {
  value = local.vpc_id
}
