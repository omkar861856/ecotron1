# ECOTRON AI Platform Manifest

This file serves as the "Source of Truth" for the Ecotron AI Utility Platform. Any AI assistant should read this file first to understand the current state of the project.

## 🏗️ Architecture Overview
- **Frontend**: Next.js 14+ (App Router) - Port 3000
- **Backend API**: Fastify (Standalone Bundle) - Port 3001
- **Proxy**: Caddy (Reverse Proxy with Internal TLS) - Ports 80/443
- **AI Engine**: Ollama (Running Llama 3.1 & Qwen 2.5) - Port 11434
- **Cache**: Redis 7-Alpine - Port 6379
- **Database**: PostgreSQL 15-Alpine - Port 5432
- **Network**: `ecotron-network` (Docker Bridge)

## 🚀 Developed Features (High-Frequency Utilities)
### 1. Resume Builder (`/api/resume`)
- **Model**: Llama 3.1
- **Function**: Professional resume generation from raw data.

### 2. Professional Rewriter (`/api/rewrite`)
- **Model**: Qwen 2.5
- **Function**: Clarity and tone optimization.

### 3. Text Summarizer (`/api/summarize`)
- **Model**: Qwen 2.5
- **Function**: 3-point bulleted summaries.

### 4. Email Generator (`/api/email`)
- **Model**: Llama 3.1
- **Function**: Instant professional email drafting.

### 5. Calculator + AI Explain (`/api/generate`)
- **Model**: Llama 3.1
- **Function**: Solve complex math/logic and provide natural language explanations.

### 6. Community Prompt Library (`/api/prompts`)
- **Database**: PostgreSQL
- **Function**: Users can browse community-submitted prompts or publish their own.

## 🔗 API Registry
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| GET | `/health` | System health check | ✅ Active |
| GET | `/api/prompts` | List community prompts | ✅ Active |
| POST | `/api/prompts` | Publish a new prompt | ✅ Active |
| POST | `/api/resume` | Resume optimization | ✅ Active |
| POST | `/api/rewrite` | Professional rewriting | ✅ Active |
| POST | `/api/summarize` | Concise summarization | ✅ Active |
| POST | `/api/email` | Email drafting | ✅ Active |

## 🛡️ Infrastructure & Constraints (CRITICAL)
- **Host Docker**: Legacy Vultr Host (Docker API v1.24). 
- **Traefik Incompatibility**: Do NOT use Traefik; it requires Docker API 1.40+.
- **SSL Strategy**: Cloudflare **"Full"** Mode. Caddy provides `tls internal`.
- **API Bundling**: Backend must be built using `tsup` with `--no-external`.

## 💰 Monetization (Live Ads)
- **Leaderboard (728x90)**: `c25ecd0c0fe9d93f6cf66f0016cbd198`
- **Sidebar (300x250)**: `eca2cd8a7fd561c8d9ddc9b4e1302ac9`
- **Skyscraper (160x300)**: `7f1e1c3d11870c7899ccce329cdd56e9`

## 🧪 Testing
- **Test Script**: `scripts/test-api.sh` - Verifies all endpoints return 200 OK.

---
*Last Updated: May 2026*
