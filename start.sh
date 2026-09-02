#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$project_dir/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$project_dir/.env"
  set +a
fi
export API_PORT="${API_PORT:-${BACKEND_PORT:-}}"
export UI_PORT="${UI_PORT:-${FRONTEND_PORT:-}}"

required() { [[ -n "${!1:-}" ]] || { echo "$1 is required" >&2; exit 1; }; }
configuration() {
  for key in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL API_PORT UI_PORT OPENROUTER_API_KEY OPENROUTER_MODEL OPENROUTER_BASE_URL ADMIN_EMAIL ADMIN_PASSWORD; do required "$key"; done
  [[ ${#NEXTAUTH_SECRET} -ge 32 ]] || { echo 'NEXTAUTH_SECRET must contain at least 32 characters' >&2; exit 1; }
  [[ "$API_PORT" != "$UI_PORT" ]] || { echo 'API_PORT and UI_PORT must differ' >&2; exit 1; }
  [[ "${ALLOW_SCHEMA_MIGRATION:-}" == 1 || "${ALLOW_SCHEMA_MIGRATION:-}" == true ]] || { echo 'ALLOW_SCHEMA_MIGRATION=true is required' >&2; exit 1; }
}
migrate() { (cd "$project_dir" && npx --no-install prisma migrate deploy); }
start_services() {
  migrate
  npm --prefix "$project_dir" run db:seed
  npm --prefix "$project_dir" run provision-demo-users
  cleanup() {
    trap - INT TERM EXIT
    [[ -z "${proxy_pid:-}" ]] || kill "$proxy_pid" 2>/dev/null || true
    [[ -z "${app_pid:-}" ]] || kill "$app_pid" 2>/dev/null || true
    [[ -z "${proxy_pid:-}" ]] || wait "$proxy_pid" 2>/dev/null || true
    [[ -z "${app_pid:-}" ]] || wait "$app_pid" 2>/dev/null || true
  }
  trap cleanup INT TERM EXIT
  (cd "$project_dir" && NODE_ENV=production ENABLE_DEMO_CREDENTIAL_AUTOFILL=true NEXTAUTH_URL="http://127.0.0.1:$UI_PORT" AUTH_COOKIE_SECURE=false ./node_modules/.bin/next start -H 127.0.0.1 -p "$API_PORT") &
  app_pid=$!
  API_PORT="$API_PORT" UI_PORT="$UI_PORT" node "$project_dir/scripts/runtime-proxy.mjs" &
  proxy_pid=$!
  wait "$app_pid" "$proxy_pid"
}

case "${1:-start}" in
  check) NODE_ENV=production npm --prefix "$project_dir" run build && npm --prefix "$project_dir" run typecheck && (cd "$project_dir" && npx --no-install eslint src/app/api/runtime-auth/me/route.ts src/app/api/runtime-ai/beauty-advice/route.ts src/lib/auth.ts) ;;
  migrate) configuration; migrate ;;
  start) configuration; start_services ;;
  *) echo 'usage: ./start.sh [check|migrate|start]' >&2; exit 2 ;;
esac
