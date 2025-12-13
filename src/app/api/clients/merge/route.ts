import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/clients/merge - Merge duplicate clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryId, secondaryId, keepFields } = body;

    if (!primaryId || !secondaryId) {
      return NextResponse.json(
        { error: "Primary and secondary client IDs are required" },
        { status: 400 }
      );
    }

    // Get both clients
    const [primary, secondary] = await Promise.all([
      prisma.client.findUnique({ where: { id: primaryId } }),
      prisma.client.findUnique({ where: { id: secondaryId } }),
    ]);

    if (!primary || !secondary) {
      return NextResponse.json(
        { error: "One or both clients not found" },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Merge data from secondary into primary
      const updateData: Record<string, unknown> = {};

      // If keepFields specified, use those from secondary
      if (keepFields) {
        for (const field of keepFields) {
          if ((secondary as Record<string, unknown>)[field]) {
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

    return NextResponse.json({
      success: true,
      client: result,
      message: `Successfully merged client records. Secondary client ${secondaryId} has been archived.`,
    });
  } catch (error) {
    console.error("Error merging clients:", error);
    return NextResponse.json(
      { error: "Failed to merge clients" },
      { status: 500 }
    );
  }
}
