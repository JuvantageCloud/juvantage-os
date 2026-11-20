# Juvantage OS Brain (API) — production-oriented image for os-brain / compose.
FROM node:20-bookworm-slim AS build
WORKDIR /repo
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN npm ci --workspace=@juvantage/shared --workspace=@juvantage/api --include-workspace-root --ignore-scripts

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build -w @juvantage/shared \
  && npx prisma generate --schema=apps/api/prisma/schema.prisma \
  && npm run build -w @juvantage/api

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/package.json ./package.json

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate && node dist/index.js"]
