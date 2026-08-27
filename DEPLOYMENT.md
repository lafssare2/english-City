# Production Deployment Guide — English City

This document describes how to deploy and configure English City in production environments (Google Cloud Run, Docker, or Kubernetes) safely and without exposing secrets.

---

## 1. Production Architecture Overview

English City runs as a unified Full-Stack Node.js service:
- The production build (`npm run build`) generates static frontend assets in `dist/` and a self-contained server bundle in `dist/server.cjs`.
- When `NODE_ENV=production`, Express serves the static frontend assets from `dist/` and handles `/api/*` requests on port 3000.
- All Gemini AI calls are executed server-side via `process.env.GEMINI_API_KEY`.
- Database access uses Google Cloud Firestore and Firebase Auth.

---

## 2. Environment Variables

Configure these environment variables in your production secret manager (e.g. Google Secret Manager / Cloud Run Environment Variables):

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key for server-side AI features | `AIzaSy...` |
| `NODE_ENV` | **Yes** | Set to `production` for live deployments | `production` |
| `PORT` | Optional | Server listening port | `3000` |
| `APP_URL` | Optional | Canonical public URL for domain validation | `https://englishcity.app` |

*Security Warning:* Never commit `.env` or credentials to source control.

---

## 3. Database & Firebase Setup

1. **Firestore Database**:
   - Ensure Cloud Firestore is enabled in Native Mode in your GCP Project.
   - If using a named Firestore database, ensure the database ID in `firebase-applet-config.json` matches the GCP database ID.

2. **Deploy Firestore Security Rules**:
   Deploy the zero-trust `firestore.rules` file to your Firebase project:
   \`\`\`bash
   firebase deploy --only firestore:rules
   \`\`\`
   Verify that sensitive subcollections (`missions`, `npc_memories`, `economy_transactions`, `learner_model`, `admins`) have `allow write: if false;`.

3. **Authentication**:
   - Enable **Google Sign-In** and **Email/Password** in Firebase Authentication Console.
   - Add your production domain to the **Authorized Domains** list in the Firebase Authentication settings.

---

## 4. Production Build & Container Execution

### Build Step
\`\`\`bash
npm ci --only=production=false
npm run build
\`\`\`

### Start Step
\`\`\`bash
NODE_ENV=production npm run start
\`\`\`

---

## 5. Health Check & Monitoring

- **Endpoint**: `GET /api/health`
- **Expected Status**: `200 OK`
- **Response Format**:
\`\`\`json
{
  "status": "ok",
  "environment": "production",
  "aiConfigured": true,
  "databaseConfigured": true,
  "timestamp": "2026-08-27T06:45:00.000Z"
}
\`\`\`

Configure your load balancer / Cloud Run startup and liveness probes to point to `/api/health`.

---

## 6. Observability & Logging

- Structured JSON logs are emitted via `requestLogger` with `requestId`, `method`, `path`, `statusCode`, `durationMs`, and `uid`.
- Rate limiting is enforced on all sensitive endpoints (AI dialogue, tutor, mission generation, auth).
- No sensitive user credentials, bearer tokens, or Gemini API keys are recorded.

---

## 7. Rollback & Disaster Recovery Strategy

1. **Instant Container Rollback**: Cloud Run and Kubernetes support instant 1-click revision rollbacks to the prior revision tag.
2. **Database Backward Compatibility**: Firestore documents are designed with additive schemas; new fields default safely if older records are read.
3. **Offline Client Resilience**: The client application caches player state in browser `localStorage` and smoothly falls back during transient network interruptions.
