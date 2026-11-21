terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.70.2"
    }
  }
}

# HCLOUD_TOKEN is read from the local environment, never from a committed file.
provider "hcloud" {}

resource "hcloud_firewall" "rimberio" {
  name = "${var.name}-web"
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = var.ssh_allowed_cidrs
  }
  dynamic "rule" {
    for_each = ["80", "443"]
    content {
      direction  = "in"
      protocol   = "tcp"
      port       = rule.value
      source_ips = ["0.0.0.0/0", "::/0"]
    }
  }
  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "rimberio" {
  name         = var.name
  image        = "ubuntu-24.04"
  server_type  = var.server_type
  location     = var.location
  ssh_keys     = var.ssh_key_ids
  firewall_ids = [hcloud_firewall.rimberio.id]
  user_data    = templatefile("${path.module}/../cloud-init.yaml.tftpl", { domain = var.domain })
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
  labels = { app = "rimberio" }
}

output "ipv4_address" {
  value = hcloud_server.rimberio.ipv4_address
}
output "console_url" {
  value = "https://${var.domain}"
}
