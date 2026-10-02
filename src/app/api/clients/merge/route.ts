import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const mergeSchema = z.object({
  primaryId: idSchema,
  secondaryId: idSchema,
  keepFields: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
});

// Profile fields that may be copied from the duplicate record. Identity,
// tenant and integration-credential fields are deliberately excluded.
const MERGEABLE_FIELDS = new Set([
  "firstName", "lastName", "email", "phone", "mobile",
  "preferredLanguage", "preferredStaffId", "preferredContactMethod",
  "birthday", "birthdayMonth", "birthdayDay",
  "allowSms", "allowEmail", "referralSource", "referredById",
  "notes", "internalNotes", "tags", "status",
]);

// POST /api/clients/merge - Merge duplicate clients (destructive)
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { primaryId, secondaryId, keepFields } = mergeSchema.parse(
      await request.json()
    );

    if (primaryId === secondaryId) {
      fail(422, "Select two different clients to merge");
    }

    // Both clients must belong to the caller's business before anything changes.
    const [primary, secondary] = await Promise.all([
      prisma.client.findFirst({ where: { id: primaryId, businessId: ctx.businessId } }),
      prisma.client.findFirst({ where: { id: secondaryId, businessId: ctx.businessId } }),
    ]);

    if (!primary || !secondary) {
      fail(404, "One or both clients not found");
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Merge data from secondary into primary
      const updateData: Record<string, unknown> = {};

      // If keepFields specified, use those from secondary
      if (keepFields) {
        for (const field of keepFields) {
          if (
            MERGEABLE_FIELDS.has(field) &&
            (secondary as Record<string, unknown>)[field]
          ) {
            updateData[field] = (secondary as Record<string, unknown>)[field];
          }
        }
      }

      // Merge tags
      const primaryTags = primary.tags || [];
      const secondaryTags = secondary.tags || [];
      updateData.tags = [...new Set([...primaryTags, ...secondaryTags])];

      // Merge notes
      if (secondary.notes) {
        updateData.notes = primary.notes
          ? `${primary.notes}\n\n--- Merged from duplicate ---\n${secondary.notes}`
          : secondary.notes;
      }

      // Update primary client
      const updatedPrimary = await tx.client.update({
        where: { id: primaryId },
        data: updateData,
      });

      // Transfer all related records to primary
      // Appointments
      await tx.appointment.updateMany({
        where: { clientId: secondaryId },
        data: { clientId: primaryId },
      });

      // Transactions
      await tx.transaction.updateMany({
        where: { clientId: secondaryId },
        data: { clientId: primaryId },
      });

      // Activities
      await tx.activity.updateMany({
        where: { clientId: secondaryId },
        data: { clientId: primaryId },
      });

      // Reviews
      await tx.review.updateMany({
        where: { clientId: secondaryId },
        data: { clientId: primaryId },
      });

      // Waitlist entries
      await tx.waitlistEntry.updateMany({
        where: { clientId: secondaryId },
        data: { clientId: primaryId },
      });

      // Transfer loyalty account
      const secondaryLoyalty = await tx.loyaltyAccount.findUnique({
        where: { clientId: secondaryId },
      });

      if (secondaryLoyalty) {
        const primaryLoyalty = await tx.loyaltyAccount.findUnique({
          where: { clientId: primaryId },
        });

        if (primaryLoyalty) {
          // Merge loyalty accounts
          await tx.loyaltyAccount.update({
            where: { clientId: primaryId },
            data: {
              pointsBalance: primaryLoyalty.pointsBalance + secondaryLoyalty.pointsBalance,
              lifetimePoints: primaryLoyalty.lifetimePoints + secondaryLoyalty.lifetimePoints,
            },
          });

          // Transfer loyalty transactions
          await tx.loyaltyTransaction.updateMany({
            where: { accountId: secondaryLoyalty.id },
            data: { accountId: primaryLoyalty.id },
          });

          // Delete secondary loyalty account
          await tx.loyaltyAccount.delete({
            where: { id: secondaryLoyalty.id },
          });
        } else {
          // Just reassign the loyalty account
          await tx.loyaltyAccount.update({
            where: { id: secondaryLoyalty.id },
            data: { clientId: primaryId },
          });
        }
      }

      // Create activity record for the merge
      await tx.activity.create({
        data: {
          clientId: primaryId,
          type: "PROFILE_UPDATED",
          title: "Client records merged",
          description: `Merged with ${secondary.firstName} ${secondary.lastName} (${secondary.email || secondary.phone || secondaryId})`,
          metadata: {
            mergedClientId: secondaryId,
            mergedClientName: `${secondary.firstName} ${secondary.lastName}`,
          },
        },
      });

      // Mark secondary as inactive (soft delete)
      await tx.client.update({
        where: { id: secondaryId },
        data: {
          status: "INACTIVE",
          notes: `Merged into client ${primaryId} on ${new Date().toISOString()}`,
        },
      });

      return updatedPrimary;
    });

    return {
      success: true,
      client: result,
      message: `Successfully merged client records. Secondary client ${secondaryId} has been archived.`,
    };
  });
}
