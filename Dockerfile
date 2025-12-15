FROM node:20-slim

RUN apt-get update && apt-get install -y \
    openssl \
    bash \
    postgresql \
    postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

# Setup PostgreSQL
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql && \
    su postgres -c "/usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data"

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
# Install platform-specific native modules for cross-platform builds
RUN npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --save-optional
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

CMD ["bash", "-c", "su postgres -c '/usr/lib/postgresql/15/bin/pg_ctl start -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile' && sleep 2 && su postgres -c '/usr/lib/postgresql/15/bin/createdb beauty_wellness_ai' 2>/dev/null; /app/start.sh"]
