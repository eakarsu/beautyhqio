#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${NEXTAUTH_URL:?NEXTAUTH_URL is required}"

if [[ ${#NEXTAUTH_SECRET} -lt 32 ]] || [[ "$NEXTAUTH_SECRET" =~ (change|demo|example|your-secret) ]]; then
  echo "NEXTAUTH_SECRET must be a non-placeholder value of at least 32 characters" >&2
  exit 1
fi

if [[ "${NODE_ENV:-development}" == "production" ]] && [[ "${CORS_ORIGINS:-}" == *"*"* ]]; then
  echo "Production CORS_ORIGINS must be an explicit allowlist" >&2
  exit 1
fi

if [[ "${NODE_ENV:-development}" == "test" && -z "${CRON_SECRET:-}" && -n "${JWT_SECRET:-}" ]]; then
  export CRON_SECRET="$JWT_SECRET"
fi

if [[ "${RUN_MIGRATIONS:-false}" == "true" ]]; then
  npx --no-install prisma migrate deploy
fi

if [[ "${NODE_ENV:-development}" != "development" && -f .next/standalone/server.js ]]; then
  export HOSTNAME="${HOST:-127.0.0.1}"
  exec npm run start
fi
exec npm run dev -- --webpack --hostname "${HOST:-127.0.0.1}" --port "${PORT:-3000}"
