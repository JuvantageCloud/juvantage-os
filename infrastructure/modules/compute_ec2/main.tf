# Amazon Linux 2023 ARM (cheap t4g.*). Switch to x86 AMI if you pick t3.*.
data "aws_ssm_parameter" "al2023_arm" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_iam_role" "ec2" {
  name = "${var.name}-ec2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = { Project = "juvantage", Name = var.name }
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.name}-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_instance" "this" {
  ami                    = data.aws_ssm_parameter.al2023_arm.value
  instance_type          = var.instance_type
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  key_name               = var.key_name
  user_data              = var.user_data

  tags = {
    Name    = var.name
    Project = "juvantage"
  }
}

resource "aws_eip" "this" {
  instance = aws_instance.this.id
  domain   = "vpc"
  tags     = { Name = var.name, Project = "juvantage" }
}
