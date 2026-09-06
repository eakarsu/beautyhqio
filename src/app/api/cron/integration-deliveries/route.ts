import { NextRequest, NextResponse } from "next/server";
import { processIntegrationDeliveries } from "@/lib/integration-deliveries";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

import { processOutboundMessages } from "@/lib/operations/messaging";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const processed = await processIntegrationDeliveries(25);
  const messages = await processOutboundMessages(25);
  return NextResponse.json({ processed, messages });
}
