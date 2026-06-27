FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false && pnpm --filter @backtest-ai/web build
EXPOSE 5173
CMD ["pnpm","--filter","@backtest-ai/web","dev"]
