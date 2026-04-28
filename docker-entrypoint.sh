#!/bin/sh
set -e

echo "Waiting for database..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" >/dev/null 2>&1; do
  sleep 1
done
echo "Database ready."

echo "Running prisma db push..."
npx prisma db push --skip-generate --accept-data-loss=false || npx prisma db push --skip-generate

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding database..."
  node /app/node_modules/.bin/tsx prisma/seed.ts || true
fi

echo "Starting Next.js..."
exec node server.js
