terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.109.0"
    }
  }
}

# DIGITALOCEAN_TOKEN is read from the local environment.
provider "digitalocean" {}

resource "digitalocean_droplet" "rimberio" {
  name      = var.name
  image     = "ubuntu-24-04-x64"
  region    = var.region
  size      = var.size
  ssh_keys  = var.ssh_key_ids
  ipv6      = true
  user_data = templatefile("${path.module}/../cloud-init.yaml.tftpl", { domain = var.domain })
}

resource "digitalocean_firewall" "rimberio" {
  name        = "${var.name}-web"
  droplet_ids = [digitalocean_droplet.rimberio.id]
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.ssh_allowed_cidrs
  }
  dynamic "inbound_rule" {
    for_each = ["80", "443"]
    content {
      protocol         = "tcp"
      port_range       = inbound_rule.value
      source_addresses = ["0.0.0.0/0", "::/0"]
    }
  }
  inbound_rule {
    protocol         = "icmp"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  dynamic "outbound_rule" {
    for_each = ["tcp", "udp"]
    content {
      protocol              = outbound_rule.value
      port_range            = "1-65535"
      destination_addresses = ["0.0.0.0/0", "::/0"]
    }
  }
  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

output "ipv4_address" {
  value = digitalocean_droplet.rimberio.ipv4_address
}
output "console_url" {
  value = "https://${var.domain}"
}
