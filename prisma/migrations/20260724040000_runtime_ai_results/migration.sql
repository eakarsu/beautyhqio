CREATE TABLE IF NOT EXISTS "runtime_ai_results" (
  "id" TEXT PRIMARY KEY,
  "business_id" TEXT,
  "user_id" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT NOT NULL CHECK ("provider" = 'openrouter'),
  "model" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "runtime_ai_results_identity_idx" ON "runtime_ai_results"("user_id", "created_at" DESC);
