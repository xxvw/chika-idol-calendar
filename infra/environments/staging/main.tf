terraform {
  required_version = "~> 1.15"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID for staging. Pass by environment variable; never commit it."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
}

provider "cloudflare" {}
