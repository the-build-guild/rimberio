variable "name" {
  type    = string
  default = "rimberio"
}
variable "region" {
  type    = string
  default = "fra1"
}
variable "size" {
  type        = string
  default     = "s-2vcpu-4gb"
  description = "Choose an available plan with at least 2 GB RAM; 4 GB is recommended."
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
  description = "Existing public SSH key IDs or fingerprints from DigitalOcean."
  validation {
    condition     = length(var.ssh_key_ids) > 0
    error_message = "Provide at least one existing SSH key ID or fingerprint."
  }
}
variable "ssh_allowed_cidrs" {
  type        = list(string)
  description = "Your administrator IP ranges."
  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0 && alltrue([for cidr in var.ssh_allowed_cidrs : can(cidrhost(cidr, 0))])
    error_message = "Provide at least one valid administrator CIDR."
  }
}
