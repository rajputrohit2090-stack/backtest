FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps
COPY apps/web apps/web
COPY packages/shared packages/shared
COPY packages/types packages/types
COPY packages/ui packages/ui
EXPOSE 5173
CMD ["pnpm", "--filter", "@backtest-ai/web", "dev"]
