# BackTest AI Architecture

## Purpose
This foundation provides the visual strategy builder shell only. It intentionally excludes MT5 integration, backtesting execution, AI, and code generation.

## Monorepo
- `apps/web`: React client with the trading workspace and module shells.
- `apps/api`: Fastify API for health checks, Swagger, and strategy save/load.
- `packages/shared`: Shared graph and strategy contracts.

## Frontend
The Strategy Builder uses React Flow for a zoomable, pannable, snap-to-grid canvas. Zustand owns graph state, history, and clipboard operations. TanStack Query coordinates save mutations. The UI uses a dark, TradingView-inspired layout with a resizable block palette and responsive navigation.

## Backend
Fastify exposes `/api/health`, `POST /api/strategies`, `PUT /api/strategies/:id`, and `GET /api/strategies/:id`. Prisma persists strategies and versions in PostgreSQL. Redis is registered as infrastructure for future caching without making the foundation unavailable when Redis is not ready during local startup.

## Data model
- `User`: account owner record.
- `Project`: workspace grouping for strategies.
- `Strategy`: current strategy graph JSON.
- `StrategyVersion`: immutable graph snapshots by version number.

## Operations
Docker Compose starts PostgreSQL, Redis, API, and web. Swagger UI is served from the API at `/docs`.
