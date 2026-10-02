import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const typeSchema = z.enum([
  "clients",
  "appointments",
  "transactions",
  "services",
  "staff",
]);

export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    if (!typeParam) fail(400, "type is required");
    const type = typeSchema.parse(typeParam);
    const format = z
      .enum(["json", "csv"])
      .default("json")
      .parse(searchParams.get("format") || "json");
    const startDate = z
      .string()
      .datetime()
      .optional()
      .parse(searchParams.get("startDate") || undefined);
    const endDate = z
      .string()
      .datetime()
      .optional()
      .parse(searchParams.get("endDate") || undefined);

    // Every export is restricted to the caller's own business.
    let data: unknown[] = [];

    switch (type) {
      case "clients":
        data = await prisma.client.findMany({
          where: { businessId: ctx.businessId },
          orderBy: { lastName: "asc" },
        });
        break;

      case "appointments":
        data = await prisma.appointment.findMany({
          where: {
            businessId: ctx.businessId,
            ...(startDate && { scheduledStart: { gte: new Date(startDate) } }),
            ...(endDate && { scheduledStart: { lte: new Date(endDate) } }),
          },
          include: {
            client: { select: { firstName: true, lastName: true, email: true, phone: true } },
            staff: { include: { user: { select: { firstName: true, lastName: true } } } },
            services: { include: { service: { select: { name: true, price: true } } } },
          },
          orderBy: { scheduledStart: "desc" },
        });
        break;

      case "transactions":
        data = await prisma.transaction.findMany({
          where: {
            location: { businessId: ctx.businessId },
            ...(startDate && { createdAt: { gte: new Date(startDate) } }),
            ...(endDate && { createdAt: { lte: new Date(endDate) } }),
          },
          include: {
            client: { select: { firstName: true, lastName: true } },
            lineItems: true,
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "services":
        data = await prisma.service.findMany({
          where: { businessId: ctx.businessId },
          orderBy: { name: "asc" },
        });
        break;

      case "staff":
        data = await prisma.staff.findMany({
          where: { location: { businessId: ctx.businessId } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        });
        break;

      default:
        return fail(400, "Invalid export type");
    }

    if (format === "csv") {
      // Convert to CSV
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return {
      type,
      count: data.length,
      data,
      exportedAt: new Date().toISOString(),
    };
  });
}

function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return "";

  const flattenObject = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
    const result: Record<string, string> = {};

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = "";
      } else if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString();
      } else {
        result[newKey] = String(value);
      }
    }

    return result;
  };

  const flatData = data.map((item) => flattenObject(item as Record<string, unknown>));
  const headers = [...new Set(flatData.flatMap((item) => Object.keys(item)))];

  const csvRows = [
    headers.join(","),
    ...flatData.map((item) =>
      headers
        .map((header) => {
          const value = item[header] || "";
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}
