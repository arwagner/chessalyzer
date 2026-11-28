# Two images from one tree, both built on the box by millwright (scripts/chessalyzer-deploy.sh there):
# `api` runs the server, `web` serves the built UI. Millwright's Caddy sends /api/* to the first and
# everything else to the second, so the browser sees one origin, as with Vite's dev proxy.

# Pinned by digest: a rebuild gets exactly this base. To update, look up the new digest of node:26-slim.
FROM node:26-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5 AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build -w @chessalyzer/web

# Node runs the TypeScript directly, so the server ships as source with production dependencies only.
FROM base AS api
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001
RUN npm ci --omit=dev -w @chessalyzer/server -w @chessalyzer/core && npm cache clean --force
COPY packages/core/src packages/core/src
COPY packages/server/src packages/server/src
USER node
EXPOSE 3001
CMD ["node", "packages/server/src/main.ts"]

# Pinned by digest, as above. To update, look up the new digest of caddy:2.
FROM caddy:2@sha256:4851e54a46b206517c574821bb5cc67f170d2156041e9fbc4c9193b45e84a75b AS web
COPY --from=build /app/packages/web/dist /srv
EXPOSE 8080
CMD ["caddy", "file-server", "--root", "/srv", "--listen", ":8080"]
