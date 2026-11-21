mock_provider "hcloud" {}

variables {
  domain            = "chat.example.com"
  ssh_key_ids       = ["123456"]
  ssh_allowed_cidrs = ["192.0.2.10/32"]
}

run "valid_https_bootstrap" {
  command = plan
  assert {
    condition     = output.console_url == "https://chat.example.com"
    error_message = "The installation must expose the expected HTTPS hostname."
  }
  assert {
    condition     = strcontains(hcloud_server.rimberio.user_data, "RIMBERIO_DOMAIN='chat.example.com'")
    error_message = "Cloud-init must pass the hostname to the HTTPS installer."
  }
}

run "reject_shell_characters_in_domain" {
  command = plan
  variables {
    domain = "chat.example.com;id"
  }
  expect_failures = [var.domain]
}

run "reject_invalid_admin_network" {
  command = plan
  variables {
    ssh_allowed_cidrs = ["not-a-cidr"]
  }
  expect_failures = [var.ssh_allowed_cidrs]
}

run "require_an_ssh_key" {
  command = plan
  variables {
    ssh_key_ids = []
  }
  expect_failures = [var.ssh_key_ids]
}

run "reject_invalid_dns_labels" {
  command = plan
  variables {
    domain = "chat..example.com"
  }
  expect_failures = [var.domain]
}
