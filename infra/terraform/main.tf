# Staging and production on Google Cloud, Jakarta region (asia-southeast2), so student data stays in Indonesia.
# One workspace per environment:  terraform workspace new staging | production
terraform {
  required_version = ">= 1.9"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  # backend "gcs" { bucket = "<state-bucket>" prefix = "ailit" }   # set once the GCP project exists
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  env  = terraform.workspace
  name = "ailit-${terraform.workspace}"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = local.name
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# --- Database -------------------------------------------------------------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "db" {
  name             = local.name
  database_version = "POSTGRES_16"
  region           = var.region
  settings {
    tier              = var.db_tier
    availability_type = local.env == "production" ? "REGIONAL" : "ZONAL"
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = local.env == "production"
    }
    ip_configuration { ipv4_enabled = true }
  }
  deletion_protection = local.env == "production"
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "app" {
  name     = "ailit"
  instance = google_sql_database_instance.db.name
}

resource "google_sql_user" "app" {
  name     = "ailit"
  instance = google_sql_database_instance.db.name
  password = random_password.db.result
}

# --- Media storage (S3-compatible via HMAC keys) ------------------------------
resource "google_storage_bucket" "media" {
  name                        = "${local.name}-media-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

resource "google_service_account" "app" {
  account_id   = "${local.name}-app"
  display_name = "AI Literacy app (${local.env})"
}

resource "google_storage_bucket_iam_member" "media_rw" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app.email}"
}

resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app.email}"
}

resource "google_storage_hmac_key" "media" {
  service_account_email = google_service_account.app.email
}

# --- Secrets --------------------------------------------------------------
resource "random_password" "payload_secret" {
  length  = 48
  special = false
}

locals {
  secrets = {
    DATABASE_URI         = "postgres://ailit:${random_password.db.result}@/ailit?host=/cloudsql/${google_sql_database_instance.db.connection_name}"
    PAYLOAD_SECRET       = random_password.payload_secret.result
    S3_ACCESS_KEY_ID     = google_storage_hmac_key.media.access_id
    S3_SECRET_ACCESS_KEY = google_storage_hmac_key.media.secret
  }
}

resource "google_secret_manager_secret" "app" {
  for_each  = local.secrets
  secret_id = "${local.name}-${lower(replace(each.key, "_", "-"))}"
  replication {
    user_managed {
      replicas { location = var.region }
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "app" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.app[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "app" {
  for_each  = local.secrets
  secret_id = google_secret_manager_secret.app[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app.email}"
}

# --- Web app --------------------------------------------------------------
resource "google_cloud_run_v2_service" "web" {
  name     = "${local.name}-web"
  location = var.region
  template {
    service_account = google_service_account.app.email
    scaling {
      min_instance_count = local.env == "production" ? 1 : 0
      max_instance_count = var.max_instances
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance { instances = [google_sql_database_instance.db.connection_name] }
    }
    containers {
      image = var.image
      ports { container_port = 8080 }
      resources {
        limits = { cpu = "1", memory = "1Gi" }
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
      env {
        name  = "NEXT_PUBLIC_SERVER_URL"
        value = var.public_url
      }
      env {
        name  = "S3_BUCKET"
        value = google_storage_bucket.media.name
      }
      env {
        name  = "S3_REGION"
        value = var.region
      }
      env {
        name  = "S3_ENDPOINT"
        value = "https://storage.googleapis.com"
      }
      dynamic "env" {
        for_each = local.secrets
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app[env.key].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }
  depends_on = [google_secret_manager_secret_iam_member.app]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
