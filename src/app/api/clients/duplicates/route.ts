import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/duplicates - Find potential duplicate clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get("threshold") || "0.8");

    // Get all active clients
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        createdAt: true,
      },
      orderBy: { lastName: "asc" },
    });

    const duplicates: Array<{
      clients: typeof clients;
      matchScore: number;
      matchReasons: string[];
    }> = [];

    // Compare each client with others
    for (let i = 0; i < clients.length; i++) {
      for (let j = i + 1; j < clients.length; j++) {
        const c1 = clients[i];
        const c2 = clients[j];
        const matchReasons: string[] = [];
        let score = 0;

        // Exact email match (high confidence)
        if (c1.email && c2.email && c1.email.toLowerCase() === c2.email.toLowerCase()) {
          score += 0.5;
          matchReasons.push("Same email");
        }

        // Exact phone match (high confidence)
        if (c1.phone && c2.phone) {
          const phone1 = c1.phone.replace(/\D/g, "");
          const phone2 = c2.phone.replace(/\D/g, "");
          if (phone1 === phone2) {
            score += 0.4;
            matchReasons.push("Same phone");
          }
        }

        // Similar name (moderate confidence)
        const name1 = `${c1.firstName} ${c1.lastName}`.toLowerCase();
        const name2 = `${c2.firstName} ${c2.lastName}`.toLowerCase();
        const nameSimilarity = calculateSimilarity(name1, name2);
        if (nameSimilarity > 0.85) {
          score += 0.3;
          matchReasons.push(`Similar name (${Math.round(nameSimilarity * 100)}%)`);
        }

        // Same first name and similar last name
        if (
          c1.firstName.toLowerCase() === c2.firstName.toLowerCase() &&
          calculateSimilarity(c1.lastName.toLowerCase(), c2.lastName.toLowerCase()) > 0.7
        ) {
          score += 0.2;
          matchReasons.push("Same first name, similar last name");
        }

        // Same birth date (if available)
        if (c1.birthday && c2.birthday) {
          if (c1.birthday.getTime() === c2.birthday.getTime()) {
            score += 0.2;
            matchReasons.push("Same birth date");
          }
        }

        // If score meets threshold, add to duplicates
        if (score >= threshold && matchReasons.length > 0) {
          duplicates.push({
            clients: [c1, c2],
            matchScore: Math.min(score, 1),
            matchReasons,
          });
        }
      }
    }

    // Sort by match score
    duplicates.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      count: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error("Error finding duplicates:", error);
    return NextResponse.json(
      { error: "Failed to find duplicates" },
      { status: 500 }
    );
  }
}

// Simple string similarity calculation (Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
