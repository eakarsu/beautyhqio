import { context, endpoint } from "@/lib/operations/core";
import { decryptCredentials } from "@/lib/operations/connections";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER"] as const;
const QB_PROVIDER = "quickbooks";

// GET /api/quickbooks/status - Connection status for the caller's business.
export async function GET() {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);

    const row = await prisma.integrationConnection.findUnique({
      where: { businessId_provider: { businessId: ctx.businessId, provider: QB_PROVIDER } },
    });
    if (!row || row.status === "DISCONNECTED") {
      return { connected: false, expired: false };
    }

    let tokenExpiry: Date | null = null;
    let realmId: string | null = null;
    try {
      const credentials = decryptCredentials(ctx.businessId, QB_PROVIDER, row.encryptedCredentials) as {
        realmId?: string;
        expiresAt?: string | Date;
      };
      realmId = credentials.realmId || null;
      tokenExpiry = credentials.expiresAt ? new Date(credentials.expiresAt) : null;
    } catch {
      return { connected: false, expired: false };
    }

    if (!realmId) return { connected: false, expired: false };

    return {
      connected: true,
      expired: !!tokenExpiry && tokenExpiry < new Date(),
      realmId,
      tokenExpiry,
    };
  });
}

// DELETE /api/quickbooks/status - Disconnect the caller's business.
export async function DELETE() {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);

    await prisma.integrationConnection.deleteMany({
      where: { businessId: ctx.businessId, provider: QB_PROVIDER },
    });

    return { disconnected: true };
  });
}
