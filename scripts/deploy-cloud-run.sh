#!/usr/bin/env bash
# Deploy Recrux backend to Cloud Run via Cloud Build (same pipeline as CI triggers).
#
# Prerequisites:
#   gcloud auth login
#   gcloud config set project recruix-backend-prod   # or your project id
#   Enable APIs: cloudbuild.googleapis.com, run.googleapis.com, containerregistry.googleapis.com
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
if [[ -z "${PROJECT}" || "${PROJECT}" == "(unset)" ]]; then
  echo "Error: no GCP project. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: ${PROJECT}"
echo "Submitting Cloud Build from ${ROOT} ..."
gcloud builds submit --config=cloudbuild.yaml .

echo
echo "Deploy finished. Tail logs:"
echo "  gcloud run services logs read recruix-backend --region=us-central1 --limit=50"
echo "Service URL:"
echo "  gcloud run services describe recruix-backend --region=us-central1 --format='value(status.url)'"
