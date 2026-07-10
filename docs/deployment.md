# Deployment Plan — AI Transformation Navigator

**Goal:** Cheap, easy-to-host deployment of (1) the Next.js app (FE + BE API routes) and (2) a remote, HTTPS MCP server callable by other devices.

**Provider preference:** AWS first; Google Cloud as fallback. Both options below.

---

## 1. Architecture

```
            ┌─────────────────────────────┐
            │  Browser (FE + chat UI)      │
            │  Web Speech API STT/TTS      │
            └──────────────┬──────────────┘
                           │ HTTPS
            ┌──────────────▼──────────────┐
            │  Next.js app (FE + /api/*)   │  ← AWS Amplify Hosting
            │  /api/chat  /api/roadmap     │     (or Vercel / Cloud Run)
            │  /api/upload /api/demo       │
            └──────┬───────────────┬───────┘
                   │               │
        LLM API    │               │ (optional)
   (Anthropic/     │               ▼
    OpenAI/        │     ┌──────────────────────┐
    DeepSeek)      │     │  MCP server (HTTPS)   │ ← AWS App Runner
                   │     │  POST /mcp (JSON-RPC) │   (or Cloud Run)
                   │     └──────────┬───────────┘
                   │                │ JSON-RPC
                   │                ▼
                   │     Voice device / external
                   │     MCP client (any device)
                   ▼
              LLM provider (same keys)
```

The Next.js app hosts the web experience and the assessment API routes. The MCP server is a **separate, standalone process** exposing the same assessment tools over HTTPS so voice devices and other clients can call it remotely.

---

## 2. Environment variables

### Next.js app
| Var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | one of the three | Enables the live assessment flow (Anthropic provider) |
| `OPENAI_API_KEY` | one of the three | OpenAI provider |
| `DEEPSEEK_API_KEY` | one of the three | DeepSeek provider |
| `LLM_PROVIDER` | optional | Force `anthropic` / `openai` / `deepseek` (else auto-select by key presence) |
| `LLM_MODEL` | optional | Override the default model for the provider |

### MCP server
All of the above LLM vars, **plus**:
| Var | Required | Purpose |
|---|---|---|
| `MCP_TRANSPORT` | yes (set to `http`) | `http` for remote hosting; `stdio` for local CLI |
| `MCP_PORT` | optional | Defaults to `8080` (App Runner injects `PORT`) |

Set secrets via the hosting provider's secret manager — **never commit `.env.local`**.

---

## 3. AWS deployment (preferred)

### 3a. Next.js app → AWS Amplify Hosting
1. Push the repo to GitHub.
2. AWS Console → Amplify Hosting → connect the repo.
3. Build settings: App root = `.worktrees/ai-navigator-impl` is NOT needed if you promote the worktree to its own repo. **Recommendation: make the worktree its own repo** (`git subtree split` or copy) so Amplify builds from the app root.
4. Build command: `npm run build`. Output directory: `.next` (Amplify detects Next.js automatically).
5. Environment variables: add the LLM keys under App settings → Environment variables.
6. Amplify provisions HTTPS automatically (managed certs, custom domain optional).
7. Cost: free tier covers the first 12 months of build + hosting for low traffic; ~$0.10–$1/mo at hackathon scale.

### 3b. MCP server → AWS App Runner
1. Push the Docker image (Task 14) to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name ai-navigator-mcp
   docker tag ai-navigator-mcp:latest <acct>.dkr.ecr.<region>.amazonaws.com/ai-navigator-mcp:latest
   docker push <acct>.dkr.ecr.<region>.amazonaws.com/ai-navigator-mcp:latest
   ```
2. App Runner → Create service → source = ECR image.
3. Set env vars: `MCP_TRANSPORT=http`, `MCP_PORT=8080`, plus the LLM keys (as App Runner secrets).
4. Port: 8080. App Runner auto-provisions HTTPS on a public URL.
5. (Optional) Restrict to known callers with an API key header check if you add one to `startMcpHttpServer`.
6. Cost: App Runner has a free tier; at idle it's ~$5–$7/mo per service. Cheapest remote-HTTPS option on AWS.

### 3c. Why not Lambda for MCP?
MCP's Streamable HTTP transport keeps a session; Lambda's request/response model fights that. App Runner (always-on container) is simpler and cheaper at this scale.

---

## 4. Google Cloud fallback

### 4a. Next.js app → Cloud Run
1. Containerize the Next.js app (a `Dockerfile` at app root using `node:20-slim`, `npm run build`, `npm start`).
2. `gcloud run deploy ai-navigator --source . --region us-central1 --allow-unauthenticated`
3. Set LLM env vars via `--set-env-vars` / `--set-secrets`.
4. Cloud Run gives an HTTPS URL automatically.

### 4b. MCP server → Cloud Run
1. Deploy the `infra/mcp/Dockerfile` image:
   ```bash
   gcloud run deploy ai-navigator-mcp --source . --region us-central1 --allow-unauthenticated --port 8080
   ```
2. Set `MCP_TRANSPORT=http`, `MCP_PORT=8080`, and LLM secrets.
3. Cost: Cloud Run bills per-request with a generous free tier; effectively free at hackathon scale.

---

## 5. Cheap-and-easy summary (pick one row)

| Option | FE+BE | MCP (HTTPS) | Est. monthly cost (low traffic) |
|---|---|---|---|
| **AWS (preferred)** | Amplify Hosting | App Runner | ~$5–$8 |
| **GCP fallback** | Cloud Run | Cloud Run | ~$0–$5 |
| **Simplest (single-provider)** | Vercel (free hobby tier) | Render/Fly.io free tier | ~$0 |

Vercel is the absolute cheapest for the Next.js app (free hobby tier), but the user asked for AWS-first, so Amplify + App Runner is the recommended path.

---

## 6. Pre-deploy checklist
- [ ] `npm run build` succeeds locally with production env.
- [ ] `npx vitest run` is green.
- [ ] `.env.local` is gitignored (it is — see `.gitignore`).
- [ ] LLM keys set as managed secrets (not inline env).
- [ ] MCP image builds and answers an `initialize` JSON-RPC over HTTP locally.
- [ ] CORS: if the browser calls the MCP server directly, add CORS headers in `startMcpHttpServer` (the Next.js app does NOT call MCP — it has its own `/api/*` — so CORS is only needed if a browser calls MCP directly, which is not the default architecture).
