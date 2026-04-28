#!/bin/bash
set -e

PG_BIN=/usr/lib/postgresql/15/bin
PG_DATA=/var/lib/postgresql/data

echo "Starting PostgreSQL..."
su postgres -c "$PG_BIN/pg_ctl start -D $PG_DATA -l /var/lib/postgresql/logfile"

until su postgres -c "$PG_BIN/pg_isready" >/dev/null 2>&1; do
  sleep 1
done

if ! su postgres -c "psql -lqt" | cut -d '|' -f 1 | grep -qw beauty_wellness_ai; then
  echo "Creating database beauty_wellness_ai..."
  su postgres -c "createdb beauty_wellness_ai"
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/beauty_wellness_ai}"

echo "Running prisma db push..."
npx --no-install prisma db push --skip-generate || true

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding database..."
  node /app/node_modules/.bin/tsx prisma/seed.ts || true
fi

echo "Starting Next.js..."
exec node server.js
