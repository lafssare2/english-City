# English City (Virtual English Learning Metropolis)

An open-world virtual city AI English learning platform featuring interactive urban districts, intelligent NPCs with episodic memory, adaptive CEFR missions, real-time voice speech recognition and pronunciation scoring, SuperMemo SM-2 spaced repetition, and career interview simulations.

---

## 🏙️ Core Architecture

- **Frontend Client**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Canvas Confetti, Lucide Icons.
- **Backend Server**: Node.js & Express 4, TypeScript via `tsx` (dev) and `esbuild` (production bundle `dist/server.cjs`).
- **AI Intelligence**: Google Gemini via `@google/genai` (server-side only with graceful offline educational fallbacks).
- **Database & Auth**: Firebase Authentication (Google OAuth + Email/Password) & Cloud Firestore with zero-trust database security rules (`firestore.rules`).
- **Pedagogical Engine**:
  - **SuperMemo SM-2** Spaced Repetition Flashcard Vault.
  - **7-Dimension CEFR Learner Telemetry** (Vocabulary, Grammar, Pronunciation, Fluency, Listening, Reading, Interaction).
  - **Episodic Long-Term NPC Memory** with conversation recall.
  - **Server-Authoritative Economy**: Anti-cheat capped XP/Coins rewards with idempotent transaction ledgers.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment
Copy `.env.example` to `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`
Set your `GEMINI_API_KEY` in `.env`.

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will be running at `http://localhost:3000`.

---

## 🧪 Testing & Verification

Run the test suites:
\`\`\`bash
# 1. Zero-Trust Security & Server API Integration Audit (32 verification checks)
npx tsx src/tests/securityAndApiAuditTest.ts

# 2. End-to-End Foundation & Pedagogical Systems Verification (22 flows)
npx tsx src/tests/e2eVerification.ts

# 3. TypeScript Compilation Check
npm run lint

# 4. Production Build Verification
npm run build
\`\`\`

---

## 🔒 Security & Server-Authority Invariants

1. **Zero-Trust Client Writes**: Direct client writes to `missions`, `npc_memories`, `economy_transactions`, and `learner_model` are strictly rejected by Firestore rules (`allow write: if false;`). All progression is verified server-side.
2. **Server-Side Reward Capping**: Every XP and coin transaction is bounded server-side (`<= 600 XP`, `<= 250 Coins`) to prevent client-forged balance exploits.
3. **Prompt Injection Defense**: Multi-pattern prompt injection filters block attempts to alter system prompts, personas, or economy state.
4. **Rate Limiting**: Sliding-window rate limiters protect AI endpoints, auth routes, and sensitive operations.
5. **Sanitized Logs**: No passwords, bearer tokens, or Gemini keys are ever printed to logs.

---

## 📦 Production Scripts

- `npm run dev`: Boots the development server with Vite middleware on port 3000.
- `npm run build`: Builds the Vite frontend into `dist/` and bundles `server.ts` into standalone `dist/server.cjs`.
- `npm run start`: Starts the production server (`node dist/server.cjs`).
- `npm run lint`: Runs type checks across the codebase.
