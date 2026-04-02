# System Architecture and Security Briefing

## Abstract
Scribe is a high-performance Next.js asynchronous intelligence extraction platform structurally engineered to transcribe, summarize, and extract objectives from enterprise audio. By deeply integrating Google's Generative Language API with client-side Web Audio matrices and highly decoupled secure REST proxies, the platform bypasses conventional API limitations natively.

## 1. Core Component Breakdown
- **Frontend Container (React 18 / Next.js 14):** Utilizes `MediaRecorder` Web Audio specs directly compiling real-time massive `.webm` blobs in RAM. For Live Captures, this runs a dual-layer extraction, cutting audio into 15-second blocks for dynamic UI updates, completely rendering memory utilization flat.
- **Data Persistence (Dexie.js):** Offline-first. IndexedDB local storage ensures your intelligence maps remain mathematically tied to the native physical machine they evaluate on.
- **Backend Edge Proxies (Next.js Edge / App Router):** Serverless architecture cleanly proxying external Google APIs preventing key leakage on client devices dynamically.

## 2. Dynamic Pipeline Routing (V2 Upgrade)
- **Zero-Latency Live Extraction:** When capturing Live, Scribe intelligently synthesizes `text-tokens` rather than Audio MultiModal vectors out to the Intelligence extraction endpoint (`/api/process-text`). This avoids the high cost factor of repeating native Google Audio API translations while resolving standard LLM Context-Truncation vectors.
- **8MB Offline Tunneling:** To bypass Vercel's physical 4.5MB HTTP boundaries, massive `.m4a`/`.wav` offline files orchestrate directly with Google's Resumable Upload File API, cutting payload architectures identically at 8MB boundaries and bypassing intermediate cloud proxies entirely.

## 3. Resilience and Failover Matrix
- **Automatic Exponential Re-Routing:** If Gemini `3.0-Flash-Preview` becomes highly congested (returning standard HTML `503` or `429` rate limit errors), standard Scribe backend routes (`/api/stream-chunk` & `/api/process-file`) will sequentially pause recursively and mathematically re-trigger execution pathways securely routing to `gemini-1.5-pro-latest` or `gemini-2.5-flash` natively to guarantee payload extraction succeeds silently without crashing the visual flow layer.

## 4. Authorization Blueprint
- Secrets routing is maintained through strict `.env.local` mappings completely shielded natively within backend isolated Node environments without any `.gitignore` leakage vectors.
