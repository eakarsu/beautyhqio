#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${NEXTAUTH_URL:?NEXTAUTH_URL is required}"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  npx --no-install prisma migrate deploy
fi

exec node server.js
