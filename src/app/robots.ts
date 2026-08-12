import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/public-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo", "/method", "/pilot", "/trust", "/privacy"],
      disallow: ["/api/", "/auth/", "/student/", "/tutor/", "/invite/"],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
    host: baseUrl.origin,
  };
}
