variable "service_name" {
  type = string
}

variable "app_port" {
  type = number
}

variable "working_directory" {
  type    = string
  default = null
}

variable "start_command" {
  type    = string
  default = "/usr/bin/node dist/index.js"
}
