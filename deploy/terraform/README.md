# Automated VPS provisioning

These templates create a VPS, attach a firewall and run the public Rimberio installer through cloud-init. They deploy the published Docker image; no application source or server credentials are included. They do not represent an approved provider Marketplace listing.

## Before applying

Install Terraform 1.7+ and add your public SSH key to the provider account/project. Keep the corresponding private key on your own computer. Choose a domain you control, a region and a server plan with at least 2 GB RAM (4 GB recommended). Applying a plan creates billable resources in your account.

Download this public repository first:

```sh
git clone https://github.com/the-build-guild/rimberio.git
cd rimberio/deploy/terraform/hetzner
# Or: cd rimberio/deploy/terraform/digitalocean
```

1. Choose `hetzner/` or `digitalocean/` and copy `terraform.tfvars.example` to `terraform.tfvars`.
2. Replace the domain, SSH key IDs and administrator public IP/CIDR. Confirm the region and plan are available in your account.
3. Configure the provider token in your local shell: `HCLOUD_TOKEN` for Hetzner or `DIGITALOCEAN_TOKEN` for DigitalOcean. Use your provider's token management page; do not put tokens in Terraform files, Git or chat.
4. From the chosen provider directory, run:

```sh
terraform init
terraform validate
terraform plan -out=deployment.tfplan
terraform apply deployment.tfplan
```

Review the plan before applying. The examples do not enable paid backup add-ons automatically.

## After creation

Terraform outputs the server IPv4 address and HTTPS URL. Set the domain's A record to that address. If an old AAAA record points elsewhere, correct or remove it. Caddy obtains the HTTPS certificate once DNS reaches the new server and TCP ports 80/443 are reachable.

SSH in using the key you selected and run:

```sh
sudo cloud-init status --wait
cd /opt/rimberio
sudo docker compose ps
```

Open the HTTPS URL and create the owner account immediately, then activate the installation and link WhatsApp. The installer generates fresh secrets in `/opt/rimberio/.env` with mode 600. It does not print those secrets in cloud-init output. Only SSH from your configured CIDRs and public TCP 80/443 are allowed inbound; Postgres and the application port are not published publicly.

Data persists across container replacement and VPS reboot. Deleting or replacing the VPS removes its disk; back up both Postgres and session data before infrastructure changes. Treat Terraform state and plan files as private and store them securely outside the public repository.

## Provider references

- [Hetzner provider](https://registry.terraform.io/providers/hetznercloud/hcloud/latest/docs) and [Cloud config](https://docs.hetzner.com/cloud/servers/getting-started/creating-a-server/).
- [DigitalOcean provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs) and [Droplet user data](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/).

Hostinger VPS customers can use the [one-command installer](../README.md#any-vps-one-command). Its domain-based mode configures Docker, Postgres and automatic HTTPS on an existing VPS.

## Validate without a cloud account

Run `terraform init -backend=false`, `terraform validate`, then `terraform test` in either provider directory. The tests mock the provider and check HTTPS bootstrap plus unsafe domain, SSH-key and administrator-network inputs without creating resources. CI repeats these checks on both templates.
