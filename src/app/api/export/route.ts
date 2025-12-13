import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "json";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    let data: unknown[] = [];

    switch (type) {
      case "clients":
        data = await prisma.client.findMany({
          orderBy: { lastName: "asc" },
        });
        break;

      case "appointments":
        data = await prisma.appointment.findMany({
          where: {
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
          orderBy: { name: "asc" },
        });
        break;

      case "staff":
        data = await prisma.staff.findMany({
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
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

    return NextResponse.json({
      type,
      count: data.length,
      data,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
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
