FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false && pnpm --filter @backtest-ai/api db:generate && pnpm --filter @backtest-ai/api build
EXPOSE 4000
CMD ["pnpm","--filter","@backtest-ai/api","start"]
