# Hyperdelivery Console

React + Vite + TypeScript console UI - the client for the console API (`src/api/`). See
the root [README.md](../../README.md) and [docs/architecture.md](../../docs/architecture.md)
for how this fits into the rest of the system.

## What it does

- **Landing page**: describe what you want to build in a chatbox; the project is named
  automatically via Claude Haiku (`orchestration/project_namer.py`) and its first Distill
  turn starts immediately.
- **Sidebar**: every project you've visited or that's awaiting a decision, with a gate
  badge (G1/G2) for projects at an approval station, search-as-you-type once there are
  more than a few, and inline rename/delete.
- **Workspace**: a continuous chat with one assistant persona across all four
  agents/stations, streamed live over SSE (including tool-use announcements, not just the
  final result); a pipeline stepper showing D/B/R/S progress; an artifacts panel showing
  each station's structured output and completeness/gaps.
- **Sign-in**: gated behind Entra ID (Azure AD) via MSAL - see `src/auth/`.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:5173, proxies to the console API on :8090
pnpm build    # production build
pnpm lint     # oxlint
```

Needs a `.env` (see `.env.example`): `VITE_API_BASE_URL`, `VITE_ENTRA_TENANT_ID`,
`VITE_ENTRA_CLIENT_ID` (same Entra ID app registration the backend validates against).

