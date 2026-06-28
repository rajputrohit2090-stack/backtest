# BackTest AI

BackTest AI is a production-ready SaaS foundation monorepo. This repository intentionally contains only foundational application, infrastructure, quality, and health-check plumbing.

## Stack

- React 19, TypeScript, Vite, TailwindCSS
- Node.js, Fastify, TypeScript, Swagger, CORS, rate limiting
- FastAPI on Python 3.12
- PostgreSQL, Redis, Prisma
- npm workspaces and Turborepo
- Docker and Docker Compose
- Vitest, Playwright, Pytest
- ESLint, Prettier, Ruff, Black

## Repository layout

```text
apps/web             React application
apps/api             Fastify API and Prisma schema
apps/python-engine   FastAPI service
packages/shared      Shared product utilities
packages/ui          Shared React UI primitives
packages/types       Shared TypeScript contracts
```

## Environment

Copy the example file before local development:

```bash
cp .env.example .env
```

The Docker Compose file provides service-specific environment variables for PostgreSQL, Redis, the Node API, the Python API, and the web application.

## Local development

```bash
npm install
npm run db:generate
npm run dev
```


Run only the current MetaTrader 5 web step:

```bash
npm run web:install
npm run web:dev
```

Then open <http://localhost:5173>. Start the Windows desktop bridge separately from `apps/desktop-bridge` before clicking **Connect to Meta5**.

Run the Python service locally from `apps/python-engine`:

```bash
python -m pip install '.[dev]'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker compose up --build
```

## Service URLs

- Web: <http://localhost:5173>
- Node API health: <http://localhost:4000/api/health>
- Node API Swagger: <http://localhost:4000/docs>
- Python API health: <http://localhost:8000/health>
- Python API Swagger: <http://localhost:8000/docs>

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
cd apps/python-engine && ruff check . && black --check . && pytest
```
