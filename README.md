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

## AI Strategy Builder

The API now exposes an AI Strategy Builder for Hindi, Hinglish, and English trading-strategy prompts. The backend reads `OPENAI_API_KEY` only from server environment variables and calls the OpenAI Responses API with Structured Outputs, following OpenAI's documented Responses API text-generation and JSON-schema style.

### Environment variables

```bash
OPENAI_API_KEY=
MT5_TERMINAL_PATH=
METAEDITOR_PATH=
GENERATED_STRATEGY_DIR=generated-strategies
```

### Endpoints

- `POST /api/strategy/ai/parse`
- `POST /api/strategy/save`
- `GET /api/strategy/search?q=`
- `GET /api/strategy/:id`
- `POST /api/strategy/:id/generate-mq5`
- `POST /api/strategy/:id/compile`
- `POST /api/strategy/:id/deploy-mt5`
- `GET /api/strategy/ai/status`
- `POST /api/strategy/:id/backtest`

Generated strategies are written to `/generated-strategies/{strategyId}/` with `strategy.json`, a compile-ready `.mq5` Expert Advisor, and `README.md`. If `METAEDITOR_PATH` is not configured, the API returns: “MQ5 file generated. Please compile it in MetaEditor to create EX5.”

### OpenAI key and AI search

For safety, users do not type the OpenAI API key in the browser. Configure `OPENAI_API_KEY` in the backend environment and use `GET /api/strategy/ai/status` from the UI to confirm whether the server key is available. Saved-template search uses that backend key to expand Hindi, Hinglish, or English search text into strategy tags/indicators before matching saved templates.

### Template backtesting

Saved templates can be prepared for MetaTrader-style backtesting with `POST /api/strategy/:id/backtest`. The request asks for practical Strategy Tester fields: symbol, timeframe, from/to dates, initial deposit, currency, leverage, execution model, spread, lot size, stop-loss points, and take-profit points. The backend writes a tester `.ini` file under `/generated-strategies/{strategyId}/backtests/`. If `MT5_TERMINAL_PATH` is configured, the backend attempts to start MetaTrader 5 with that tester config; otherwise it returns a clear configuration-ready message and does not fake a result.
