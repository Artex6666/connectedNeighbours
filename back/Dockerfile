FROM node:20-alpine AS build

RUN npm install -g pnpm@10.33.0

WORKDIR /app

# Copy workspace config first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY back/package.json ./back/

RUN pnpm install --frozen-lockfile

COPY back/tsconfig.json ./back/
COPY back/src ./back/src

RUN pnpm --filter back run build

# ── Production image ──────────────────────────────────────────────────────────

FROM node:20-alpine AS production

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY back/package.json ./back/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/back/dist ./back/dist

WORKDIR /app/back

EXPOSE 3000

CMD ["node", "dist/server.js"]
