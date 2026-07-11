# Example Deployment: GCP Cloud Run Deployment Guide — AI Transformation Navigator

**Goal:** manually deploy a small demonstration environment in Google Cloud:

- the Next.js web application (frontend and API routes);
- a public Streamable HTTP MCP endpoint for Agora MyBot / ESP32; and
- one Google Cloud Storage (GCS) bucket holding a JSON file for each shared assessment session.

This guide intentionally targets a **single-device demo**, not a multi-tenant production system.

> **Current implementation:** `GCS_SESSION_BUCKET` enables a shared JSON-session repository for both the web/API routes and MCP service. When it is unset, local development uses an in-memory fallback. The GCS bucket, service-account permissions, and deployed `APP_BASE_URL` still need to be configured before the web app and ESP32 can share sessions in Cloud Run.

---

## Target architecture

```text
Browser ─────── HTTPS ─────► Cloud Run: ai-navigator-web
                                      │
                                      │ read / write session JSON
                                      ▼
                                 GCS bucket
                              sessions/<sessionId>.json
                                      ▲
                                      │ read / write session JSON
ESP32 → Agora MyBot ─ MCP/HTTPS ─► Cloud Run: ai-navigator-mcp (/mcp)
```

Cloud Run services are stateless. Never use their local filesystem or process memory as persistent history. The two services instead use the same GCS bucket and service-session repository.

### Session JSON shape

Use one object per assessment, for example:

```text
gs://ai-navigator-demo-sessions/sessions/<opaque-session-id>.json
```

The object should contain the complete `AssessmentSession`: profile, conversation history, evidence, dimension scores, document signals, framework version, and timestamps. The browser must never receive GCP credentials or direct bucket access.

For each web or MCP turn:

1. Authenticate/validate the caller for the demo.
2. Read the JSON object.
3. Restore an `AssessmentEngine` from it.
4. Run exactly one assessment turn.
5. Save the new snapshot using the object's generation as a write precondition.
6. If the object changed first, reload and retry or return a retryable conflict.

Generation matching prevents a browser and ESP32 turn from silently overwriting one another.

---

## 1. Pre-deploy code checks

The implementation includes JSON-safe engine snapshots, a GCS repository with generation-match writes, session-aware MCP tools, server-side report loading by session ID, a web Dockerfile, and a bundled MCP build.

The MCP surface is voice-safe and session-oriented: `assessment_list_demos`, `assessment_start`, `assessment_continue`, `assessment_status`, `assessment_resume`, and `assessment_finish`. Every stateful follow-up tool receives the opaque session ID returned at start.

Do not deploy until these checks pass:

```bash
npm test
npm run build
npm run build:mcp
```

---

## 2. One-time GCP setup

### 2.1 Prerequisites

- A Google Cloud project with billing enabled.
- Google Cloud CLI (`gcloud`) installed and authenticated.
- Docker Desktop is optional; the recommended Cloud Build commands do not use a local Docker daemon.
- LLM provider keys; Agora values only if using browser/Agora voice.

Run these commands from the repository root. Choose one nearby supported Cloud Run region; this guide uses `asia-southeast1` as an example.

```bash
gcloud auth login
gcloud auth application-default login
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-southeast1
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com secretmanager.googleapis.com
```

If the project already exists, omit `gcloud projects create`.

### 2.2 Set reusable shell variables

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-southeast1"
export REPOSITORY="ai-navigator"
export BUCKET="${PROJECT_ID}-ai-navigator-sessions"
export WEB_SERVICE="ai-navigator-web"
export MCP_SERVICE="ai-navigator-mcp"
gcloud config set project "$PROJECT_ID"
```

### 2.3 Create Artifact Registry and the session bucket

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="AI Navigator container images"

gcloud storage buckets create "gs://${BUCKET}" \
  --location="$REGION" \
  --uniform-bucket-level-access
```

Keep the bucket private. For a demo, optionally enable object versioning so an overwritten session can be recovered:

```bash
gcloud storage buckets update "gs://${BUCKET}" --versioning
```

### 2.4 Create two dedicated service accounts

```bash
gcloud iam service-accounts create ai-navigator-web \
  --display-name="AI Navigator web Cloud Run service"

gcloud iam service-accounts create ai-navigator-mcp \
  --display-name="AI Navigator MCP Cloud Run service"

export WEB_SA="ai-navigator-web@${PROJECT_ID}.iam.gserviceaccount.com"
export MCP_SA="ai-navigator-mcp@${PROJECT_ID}.iam.gserviceaccount.com"
```

Grant each service account object access only on this bucket:

```bash
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/storage.objectUser"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${MCP_SA}" \
  --role="roles/storage.objectUser"
```

### 2.5 Store secrets in Secret Manager

Use at least one LLM key. Do not put values in Git, Dockerfiles, or `--set-env-vars` commands.

```bash
printf '%s' 'REPLACE_WITH_OPENAI_KEY' | gcloud secrets create openai-api-key --data-file=-
printf '%s' 'REPLACE_WITH_AGORA_APP_CERTIFICATE' | gcloud secrets create agora-app-certificate --data-file=-
printf '%s' 'REPLACE_WITH_AGORA_CUSTOMER_ID' | gcloud secrets create agora-customer-id --data-file=-
printf '%s' 'REPLACE_WITH_AGORA_CUSTOMER_SECRET' | gcloud secrets create agora-customer-secret --data-file=-
```

Grant the relevant service accounts permission to read the secrets they use:

```bash
for SA in "$WEB_SA" "$MCP_SA"; do
  gcloud secrets add-iam-policy-binding openai-api-key \
    --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
done

for SECRET in agora-app-certificate agora-customer-id agora-customer-secret; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${WEB_SA}" --role="roles/secretmanager.secretAccessor"
done
```

If not using Agora voice, skip the Agora secrets and references below.

---

## 3. Build and deploy the web service

The root `Dockerfile` builds the Next.js application and runs `next start` on `0.0.0.0:$PORT`. Use Cloud Build as the recommended path: it builds the Linux container in GCP and does not require Docker Desktop or a local Docker daemon.

```bash
export WEB_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/ai-navigator-web:demo"
gcloud builds submit --tag "$WEB_IMAGE" .
```

Optional local-Docker alternative, only when Docker Desktop is running:

```bash
docker build --platform linux/amd64 -t "$WEB_IMAGE" .
gcloud auth configure-docker "${REGION}-docker.pkg.dev"
docker push "$WEB_IMAGE"
```

Deploy the service. The first deployment uses a temporary placeholder for `APP_BASE_URL`; set the final URL immediately afterwards.

```bash
gcloud run deploy "$WEB_SERVICE" \
  --image="$WEB_IMAGE" \
  --service-account="$WEB_SA" \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="LLM_PROVIDER=openai,GCS_SESSION_BUCKET=${BUCKET},APP_BASE_URL=https://placeholder.invalid,AGORA_APP_ID=YOUR_AGORA_APP_ID" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,AGORA_APP_CERTIFICATE=agora-app-certificate:latest,AGORA_CUSTOMER_ID=agora-customer-id:latest,AGORA_CUSTOMER_SECRET=agora-customer-secret:latest"

export WEB_URL="$(gcloud run services describe "$WEB_SERVICE" --region="$REGION" --format='value(status.url)')"
echo "$WEB_URL"
```

Update `APP_BASE_URL` with the real Cloud Run URL:

```bash
gcloud run services update "$WEB_SERVICE" \
  --region="$REGION" \
  --update-env-vars="APP_BASE_URL=${WEB_URL}"
```

---

## 3.5 Optional: map `navigator.zhengaustin.com` to the web service

Use this step when a custom HTTPS callback URL is needed for Agora. The domain registration can live in a **different GCP project** from Cloud Run. The important distinction is:

- create the Cloud Run domain mapping in the **deployment project** (the project containing `ai-navigator-web`);
- create/update the DNS record in the project or provider that owns the domain's authoritative DNS; and
- verify ownership of the apex domain (`zhengaustin.com`) with the Google account that creates the mapping.

For the requested domain, set:

```bash
export DEPLOYMENT_PROJECT_ID="$PROJECT_ID"
export DOMAIN_PROJECT_ID="octopus-211010"
export NAVIGATOR_DOMAIN="navigator.zhengaustin.com"
```

A subdomain does **not** require a new domain registration; it is only a DNS record under the existing apex domain.

### 3.5.1 Verify the base domain from the deployment project

Use the deployment project, not the domain-registration project:

```bash
gcloud config set project "$DEPLOYMENT_PROJECT_ID"
gcloud domains list-user-verified
gcloud domains verify "zhengaustin.com"
```

Complete the Search Console DNS verification when prompted. For a subdomain such as `navigator.example.com`, Google requires verification of `example.com`, not the subdomain. If a different Google account owns the verified domain, add the deployment account as a verified owner in Search Console.

### 3.5.2 Create the Cloud Run domain mapping

Cloud Run domain mapping is the quickest demo option. It is currently Preview; for a production deployment Google recommends a global external Application Load Balancer instead.

```bash
gcloud config set project "$DEPLOYMENT_PROJECT_ID"
gcloud beta run domain-mappings create \
  --service="$WEB_SERVICE" \
  --domain="$NAVIGATOR_DOMAIN" \
  --region="$REGION"

gcloud beta run domain-mappings describe \
  --domain="$NAVIGATOR_DOMAIN" \
  --region="$REGION"
```

Copy every record listed under `resourceRecords` from the final command. Do not guess the A/AAAA/CNAME values.

### 3.5.3 Add the generated DNS records in the domain project

First identify where the authoritative DNS zone exists:

```bash
gcloud dns managed-zones list --project="$DOMAIN_PROJECT_ID"
```

If the `zheng...` zone is managed by Cloud DNS in `octopus-211010`, open **Network services → Cloud DNS → that managed zone → Add standard** in that project and add every `resourceRecords` entry Cloud Run returned. If the domain uses another DNS provider, add the same records at that provider instead.

The registration project and the Cloud Run project do not need to be the same. What matters is that the DNS update is made in the authoritative zone.

### 3.5.4 Switch Agora to the custom HTTPS origin

Wait until the mapping shows ready and browse to:

```text
https://navigator.zhengaustin.com
```

Google-managed TLS provisioning typically takes around 15 minutes, but can take up to 24 hours. Keep using the original `run.app` URL until HTTPS works.

Then update the web service so Agora uses the custom public callback origin:

```bash
gcloud config set project "$DEPLOYMENT_PROJECT_ID"
gcloud run services update "$WEB_SERVICE" \
  --region="$REGION" \
  --update-env-vars="APP_BASE_URL=https://${NAVIGATOR_DOMAIN}"
```

Restart any local test session after changing its `APP_BASE_URL`. Agora will then call:

```text
https://navigator.xxx.com/api/agora/llm
```

This maps the **web service** used by the Agora callback. If Agora MyBot also needs a custom MCP address, create a separate mapping such as `mcp.navigator.xxx.com` to `ai-navigator-mcp`; do not route `/mcp` through the web service unless an explicit gateway is added.

---

## 4. Build and deploy the MCP service

The existing MCP Dockerfile is at `infra/mcp/Dockerfile`. Do not continue until `npm run build:mcp` is green locally: Cloud Run cannot fix a TypeScript/module-resolution failure in the image build.

```bash
export MCP_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/ai-navigator-mcp:demo"
gcloud builds submit \
  --config=infra/mcp/cloudbuild.yaml \
  --substitutions=_IMAGE="$MCP_IMAGE" \
  .
```

The separate Cloud Build configuration is necessary because the MCP Dockerfile is under `infra/mcp/`, rather than at the repository root.

Deploy it as a separate public service. The current prototype has no MCP authentication; restrict or add authentication before exposing it beyond the controlled demo environment.

```bash
gcloud run deploy "$MCP_SERVICE" \
  --image="$MCP_IMAGE" \
  --service-account="$MCP_SA" \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="MCP_TRANSPORT=http,LLM_PROVIDER=openai,GCS_SESSION_BUCKET=${BUCKET},APP_BASE_URL=https://placeholder.invalid" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest"

export MCP_URL="$(gcloud run services describe "$MCP_SERVICE" --region="$REGION" --format='value(status.url)')"
echo "MCP endpoint: ${MCP_URL}/mcp"
```

After the web custom domain is ready, update the MCP service too so its `assessment_start` response can include the companion web report URL:

```bash
gcloud run services update "$MCP_SERVICE" \
  --region="$REGION" \
  --update-env-vars="APP_BASE_URL=https://navigator.zhengaustin.com"
```

Configure Agora MyBot with `${MCP_URL}/mcp`. The endpoint accepts Streamable HTTP **POST** requests; opening either `${MCP_URL}` or `${MCP_URL}/mcp` in a browser sends GET and returns `404 Not found` by design.

---

## 5. Verify the deployment

### 5.1 Web check

Open `$WEB_URL` and confirm:

- landing page loads over HTTPS;
- `/assess?demo=true` renders;
- a chat turn creates/updates `sessions/<id>.json` in the bucket;
- `/history` and `/report?session=<id>` load shared state through the server, not only browser `localStorage`.

Inspect demo objects without downloading credentials to the browser:

```bash
gcloud storage ls "gs://${BUCKET}/sessions/"
```

### 5.2 MCP check

MCP is not a browser page. Verify it with a real Streamable HTTP JSON-RPC initialization request:

```bash
curl -i -X POST "${MCP_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "curl-smoke-test", "version": "1.0" }
    }
  }'
```

Success is HTTP `200` with an MCP JSON-RPC response. The response can be formatted as an SSE event:

```text
event: message
data: {"result":{"serverInfo":{"name":"ai-transformation-navigator"},...}}
```

Then call `tools/list` with the `MCP-Protocol-Version: 2025-06-18` header. Use `tools/call` with `assessment_start` to create a full or demo session, then call `assessment_continue` for every finalized text turn. The returned session ID should produce a report in the web application.

### 5.3 Voice check

For browser Agora voice, test text → voice → text and verify the scorecard and history remain continuous. For ESP32/MyBot, complete one short assessment and then open its report URL in a clean browser.

---

## 6. Demo operating rules and limits

- Keep Cloud Run stateless; do not rely on container disk or a `Map` in process memory.
- Use an unguessable ID for every session. Do not expose bucket URLs.
- Keep the GCS bucket private and grant only the two Cloud Run service accounts bucket-object access.
- Use Cloud Storage generation matching for every overwrite; return a retryable conflict rather than losing a turn.
- Treat the current public MCP endpoint as demo-only until bearer authentication, session ownership, input limits, and rate limits are implemented.
- Set Cloud Run maximum instances to `1` for the simplest demo only if the GCS repository is fully in use; shared storage remains necessary even with one instance because web and MCP are different services.
- Add a bucket lifecycle rule after the demo if assessment data should expire.

---

## 7. Troubleshooting

| Symptom | Likely cause / action |
|---|---|
| Cloud Run deployment says the container did not listen on the required port | Ensure the web server and MCP server listen on `0.0.0.0:$PORT`; Cloud Run injects `PORT` into the ingress container. |
| Local Docker build cannot connect to the Docker daemon | Use the recommended `gcloud builds submit` commands instead of local Docker, or start Docker Desktop. |
| Cloud Run says the web/MCP image was not found | Build and push the exact image name first with `gcloud builds submit`; verify it appears in Artifact Registry before deploying. |
| MCP returns `404` when opened in a browser | Expected: MCP only accepts POST JSON-RPC at `${MCP_URL}/mcp`. Use the curl initialization command above. |
| MCP returns HTTP `500` on a JSON-RPC request | Rebuild and deploy the latest MCP image. The current implementation creates a fresh stateless MCP transport for each request, which is required by the MCP SDK. Check `gcloud run services logs read "$MCP_SERVICE" --region="$REGION" --limit=50` for any remaining application error. |
| A report opened in FE is empty after an ESP32 assessment | The FE is still using browser-local state or process memory; switch it to the shared GCS repository and load by session ID. |
| Two turns lose data | Add/read the GCS object generation and use it as an overwrite precondition, then retry on conflict. |
| Cloud Run Agora session endpoint returns `403` | Deploy the current web image, set `APP_BASE_URL=https://navigator.zhengaustin.com`, and access the site through that same HTTPS origin. The current handler explicitly trusts the configured public origin and Cloud Run forwarded host. |
| Cloud Run Agora session endpoint returns `500` | Confirm `AGORA_APP_ID` is a normal web-service environment variable and `OPENAI_API_KEY`, `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_ID`, and `AGORA_CUSTOMER_SECRET` are attached Secret Manager values. Review the API response body or web-service logs for the exact missing variable. |
| Domain mapping reports `CertificatePending` | Create the exact DNS records returned by the mapping. For the confirmed `navigator.zhengaustin.com` mapping, the record is `navigator CNAME ghs.googlehosted.com.`. Wait 15–30 minutes after public DNS resolves; certificate issuance can take up to 24 hours. |
| MyBot cannot call MCP | Confirm it supports direct Streamable HTTP and configure the exact `${MCP_URL}/mcp` URL; otherwise use the optional bridge described in the Xiaozhi plan. |

---

## References

- [Cloud Run container runtime contract](https://cloud.google.com/run/docs/container-contract)
- [Deploy Cloud Run services](https://cloud.google.com/run/docs/deploying)
- [Map a custom domain to Cloud Run](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Cloud Storage request preconditions](https://cloud.google.com/storage/docs/request-preconditions)
- [Cloud Storage consistency and atomic operations](https://cloud.google.com/storage/docs/consistency)
