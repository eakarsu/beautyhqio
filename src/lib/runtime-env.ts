export function authSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32 || /change|your-secret|demo|example/i.test(secret)) {
    throw new Error("NEXTAUTH_SECRET must be a non-placeholder value of at least 32 characters");
  }
  return secret;
}

export function assertProductionEnvironment(): void {
  if (process.env.NODE_ENV !== "production") return;
  authSecret();
  for (const key of ["DATABASE_URL", "NEXTAUTH_URL", "CRON_SECRET"]) {
    if (!process.env[key]) throw new Error(`${key} is required in production`);
  }
  if ((process.env.CRON_SECRET || "").length < 32) {
    throw new Error("CRON_SECRET must be at least 32 characters in production");
  }
  if ((process.env.CORS_ORIGINS || "").includes("*")) {
    throw new Error("CORS_ORIGINS must be an explicit allowlist in production");
  }
}
