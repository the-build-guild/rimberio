variable "name" {
  type    = string
  default = "rimberio"
}
variable "location" {
  type    = string
  default = "nbg1"
}
variable "server_type" {
  type        = string
  default     = "cx23"
  description = "Choose a type available in your selected location; ARM64 types also work."
}
variable "domain" {
  type        = string
  description = "DNS hostname only; point its A record at the output IPv4 address."
  validation {
    condition     = length(var.domain) <= 253 && can(regex("^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$", var.domain))
    error_message = "Use a DNS hostname without a scheme, path or shell characters."
  }
}
variable "ssh_key_ids" {
  type        = list(string)
  description = "IDs of existing public SSH keys in this Hetzner project."
  validation {
    condition     = length(var.ssh_key_ids) > 0
    error_message = "Provide at least one existing SSH key ID."
  }
}
variable "ssh_allowed_cidrs" {
  type        = list(string)
  description = "Your administrator IP ranges. SSH is not opened to the entire Internet by default."
  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0 && alltrue([for cidr in var.ssh_allowed_cidrs : can(cidrhost(cidr, 0))])
    error_message = "Provide at least one valid administrator CIDR."
  }
}
