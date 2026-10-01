FROM node:22.22.1-slim AS deps
RUN apt-get update -qq && apt-get install --no-install-recommends -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# The lockfile was generated on macOS and omits the Linux builds of
# lightningcss / @tailwindcss/oxide. Install those two native binaries
# explicitly while keeping every other locked version.
RUN npm ci --no-audit --no-fund \
 && npm install --no-save --no-audit --no-fund \
      lightningcss-linux-x64-gnu@1.30.2 \
      @tailwindcss/oxide-linux-x64-gnu@4.1.18 \
 && npx prisma generate

FROM node:22.22.1-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22.22.1-slim AS runner
RUN apt-get update -qq && apt-get install --no-install-recommends -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
USER node
EXPOSE 3000
# Clear the node base image's entrypoint so our script is executed directly.
ENTRYPOINT []
CMD ["./docker-entrypoint.sh"]
