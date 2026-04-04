# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY front/package.json ./front/

RUN pnpm install --frozen-lockfile

COPY front ./front

RUN pnpm build

FROM nginx:1.27-alpine AS production

COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
