# BackTest AI

BackTest AI is a production-oriented monorepo foundation for a browser-based visual trading strategy builder.

## Stack
- React 19, TypeScript, Vite, Tailwind CSS, React Flow, React Router, Zustand, TanStack Query
- Node.js 22, Fastify, TypeScript
- PostgreSQL, Prisma ORM, Redis
- pnpm workspaces and Turborepo

## Getting started
```bash
pnpm install
cp .env.example apps/api/.env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Docker
```bash
docker compose up --build
```

## Endpoints
- Web: http://localhost:5173
- API health: http://localhost:4000/api/health
- Swagger UI: http://localhost:4000/docs

## Strategy persistence
Strategies are saved as JSON graphs:
```json
{ "nodes": [], "edges": [], "version": 1 }
```
