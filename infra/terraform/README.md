# Infrastructure (Google Cloud, Jakarta)

Staging and production run on Cloud Run with Cloud SQL (PostgreSQL 16), a private media bucket and Secret
Manager, all in `asia-southeast2` (Jakarta) so student data stays in Indonesia.

```bash
terraform init
terraform workspace new staging
terraform apply -var project_id=<gcp-project> -var image=<image> -var public_url=https://staging.<domain>
```

Status: written but not yet applied — needs a GCP project, billing and a state bucket. `terraform validate`
has not been run yet (provider registry was not reachable from the build sandbox); run it on first init.
