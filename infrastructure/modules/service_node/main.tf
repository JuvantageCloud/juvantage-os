locals {
  workdir = coalesce(var.working_directory, "/opt/${var.service_name}")
}

output "systemd_unit" {
  description = "Paste onto the EC2 host as /etc/systemd/system/${var.service_name}.service"
  value       = <<-UNIT
    [Unit]
    Description=${var.service_name}
    After=network.target

    [Service]
    Type=simple
    WorkingDirectory=${local.workdir}
    ExecStart=${var.start_command}
    Restart=always
    RestartSec=3
    Environment=NODE_ENV=production
    Environment=PORT=${var.app_port}
    Environment=HOST=0.0.0.0
    # Load secrets from a file you create on the box (from Secrets Manager), e.g.:
    # EnvironmentFile=/etc/${var.service_name}.env

    [Install]
    WantedBy=multi-user.target
  UNIT
}

output "install_hint" {
  value = "sudo systemctl enable --now ${var.service_name}"
}
