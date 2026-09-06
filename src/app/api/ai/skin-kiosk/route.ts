import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, idSchema } from '@/lib/operations/core';
import { runAI, validateImage } from '@/lib/operations/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-helpers';
const outputSchema = z.object({ observations: z.array(z.string().max(600)).max(10), recommended_services: z.array(z.object({ name: z.string().max(100), why: z.string().max(500) })).max(5), home_care_tips: z.array(z.string().max(500)).max(5), limitations: z.array(z.string().max(500)).min(1).max(5) });
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const input = z.object({ imageData: z.string().max(7000000), clientId: idSchema, concerns: z.string().max(2000).default(''), kioskId: z.string().max(100).optional() }).parse(await req.json());
    if (ctx.user.role === 'CLIENT' && input.clientId !== ctx.user.clientId) return fail(403, 'Only your own photos may be analyzed');
    if (!await prisma.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId } })) return fail(404, 'Client not found');
    const consent = await prisma.aIConsent.findFirst({ where: { businessId: ctx.businessId, clientId: input.clientId, feature: 'skin_analyzer' }, orderBy: { createdAt: 'desc' } });
    if (!consent?.granted) return fail(422, 'Record client consent for photo processing before submitting an image');
    const metadata = validateImage(input.imageData);
    const row = await runAI(ctx, req, 'skin-kiosk', { clientId: input.clientId, concerns: input.concerns, consentId: consent.id, image: metadata }, [
      { role: 'system', content: 'Describe only visible cosmetic features with uncertainty. Do not diagnose disease, infer sensitive traits, assign health scores, or recommend medical treatment. Do not claim clinically validated results. Include image/lighting limitations. Reply only JSON: {"observations":[],"recommended_services":[{"name":"","why":""}],"home_care_tips":[],"limitations":[]}.' },
      { role: 'user', content: [{ type: 'text', text: `Optional cosmetic concerns: ${input.concerns}` }, { type: 'image_url', image_url: { url: input.imageData } }] },
    ], outputSchema, process.env.OPENROUTER_VISION_MODEL || DEFAULT_AI_MODEL);
    return { type: 'skin-kiosk', result: row.output, model: row.model, status: row.status, id: row.id, imageSent: true };
  });
}
