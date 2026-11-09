variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Jakarta region keeps data in Indonesia"
  type        = string
  default     = "asia-southeast2"
}

variable "image" {
  description = "Container image for the web app (from Artifact Registry)"
  type        = string
}

variable "public_url" {
  description = "Public URL of this environment, e.g. https://staging.example.id"
  type        = string
}

variable "db_tier" {
  type    = string
  default = "db-custom-1-3840"
}

variable "max_instances" {
  type    = number
  default = 10
}
