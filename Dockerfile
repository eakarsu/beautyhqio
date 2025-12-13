FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl bash postgresql postgresql-contrib

# Setup PostgreSQL
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql && \
    su postgres -c "initdb -D /var/lib/postgresql/data"

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

RUN chmod +x /app/start.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD su postgres -c "pg_ctl start -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile" && \
    sleep 2 && \
    su postgres -c "createdb beauty_wellness_ai" 2>/dev/null; \
    /app/start.sh
