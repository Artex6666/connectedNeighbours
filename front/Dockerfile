# syntax=docker/dockerfile:1

# ── Stage 1 : Build du JAR Java ──────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS java-build

WORKDIR /app
COPY desktop/pom.xml ./
COPY desktop/src ./src
RUN mvn package -q

# ── Stage 2 : Build du front React ───────────────────────────────────────────
FROM node:22-alpine AS build

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY front/package.json ./front/

RUN pnpm install --frozen-lockfile

COPY front ./front

# API base URL is baked into the static bundle at build time. Override via
# `--build-arg VITE_API_BASE_URL=...` (defaults to localhost for local builds).
ARG VITE_API_BASE_URL=http://localhost:3000/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm build

# ── Stage 3 : Nginx ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html
COPY --from=java-build /app/target/bobconnect.jar /usr/share/nginx/html/bobconnect.jar

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
