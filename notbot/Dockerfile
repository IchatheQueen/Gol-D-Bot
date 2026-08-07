# Build stage — needs a toolchain because better-sqlite3 is a native module.
# It is only imported by src/database/migrate_weapons.ts (a one-off script),
# but it sits in `dependencies`, so npm ci compiles it regardless.
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies (typescript, ts-node, nodemon) from the tree we ship.
RUN npm prune --omit=dev


# Runtime stage — same base image, so the compiled native binary stays valid.
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Discord bots hold an outbound gateway connection and listen on no port.
CMD ["node", "dist/index.js"]
