import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://beautyhq.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/calendar/",
          "/clients/",
          "/appointments/",
          "/staff/",
          "/services/",
          "/products/",
          "/reports/",
          "/marketing/",
          "/pos/",
          "/ai/",
          "/kiosk/",
          "/book/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
