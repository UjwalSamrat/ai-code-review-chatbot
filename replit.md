# AI Code Review Chatbot

## Overview

A production-ready full-stack AI chatbot that takes a code snippet and a question, then returns an intelligent code review response powered by OpenAI GPT.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS, TanStack Query, wouter
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations (no API key needed)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

- `artifacts/web/` — React frontend (dark IDE-style chat UI)
- `artifacts/api-server/` — Express backend
  - `src/routes/chat/index.ts` — POST /chat, GET /chat/history
  - `src/routes/health.ts` — GET /healthz
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — PostgreSQL + Drizzle schema
- `lib/integrations-openai-ai-server/` — OpenAI SDK wrapper

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/web run dev` — run frontend locally

## API Endpoints

- `POST /api/chat` — Body: `{ question: string, code: string }` → Returns `{ answer: string, id: number }`
- `GET /api/chat/history` — Returns array of past chat messages

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit AI Integrations
- `DATABASE_URL` — PostgreSQL connection string (auto-set)

## Database Schema

- `chat_messages` table: `id`, `question`, `code`, `answer`, `created_at`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
