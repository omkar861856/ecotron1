# ECOTRON AI Platform Manifest

This file serves as the "Source of Truth" for the Ecotron AI Utility Platform. Any AI assistant should read this file first to understand the current state of the project.

## 🏗️ Architecture Overview
- **Frontend**: Next.js 14+ (App Router) - Port 3000
- **Backend API**: Fastify (Standalone Bundle) - Port 3001
- **Proxy**: Caddy (Reverse Proxy with Internal TLS) - Ports 80/443
- **AI Engine**: Ollama (Running Llama 3.1 & Qwen 2.5) - Port 11434
- **Cache**: Redis 7-Alpine - Port 6379
- **Network**: `ecotron-network` (Docker Bridge)

## 🚀 Developed Features
### 1. Resume Builder (`/api/resume`)
- **Model**: Llama 3.1
- **Function**: Takes raw user data and generates professional Markdown-formatted resumes.

### 2. Professional Rewriter (`/api/rewrite`)
- **Model**: Qwen 2.5
- **Function**: Enhances text flow, clarity, and professionalism while maintaining meaning.

### 3. Text Summarizer (`/api/summarize`)
- **Model**: Qwen 2.5
- **Function**: Distills long text into 3 concise bullet points.

### 4. General Generator (`/api/generate`)
- **Model**: Llama 3.1
- **Function**: Universal AI generation endpoint.

## 🔗 API Registry
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| GET | `/health` | System health check | ✅ Active |
| POST | `/api/generate` | Universal generation | ✅ Active |
| POST | `/api/resume` | Resume optimization | ✅ Active |
| POST | `/api/rewrite` | Professional rewriting | ✅ Active |
| POST | `/api/summarize` | Concise summarization | ✅ Active |

## 🛡️ Infrastructure & Constraints (CRITICAL)
- **Host Docker**: Legacy Vultr Host (Docker API v1.24). 
- **Traefik Incompatibility**: Do NOT use Traefik; it requires Docker API 1.40+.
- **SSL Strategy**: Cloudflare **"Full"** Mode. Caddy provides `tls internal` (Self-signed) which Cloudflare accepts.
- **API Bundling**: Backend must be built using `tsup` with `--no-external` to bundle all dependencies into a single `dist/index.js`.
- **Deployment**:
    - Primary: GitHub Actions (`deploy.yml`)
    - Manual: `git fetch origin && git reset --hard origin/main && docker compose -f docker-compose.prod.yml up -d --build`

## 💰 Monetization
- **Ad Grid**: High-density ad slots implemented in `page.tsx`.
- **Slots**:
    - Leaderboard (728x90) - Top/Bottom
    - Sidebar (300x250)
    - Sticky (300x600)

## 🧪 Testing
- **Test Script**: `scripts/test-api.sh` - Verifies all endpoints return 200 OK.

---
*Last Updated: May 2026*
