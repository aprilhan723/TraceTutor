import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/public-url";

const publicRoutes = [
  "",
  "/demo",
  "/method",
  "/pilot",
  "/trust",
  "/privacy",
  "/content-standards",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();

  return publicRoutes.map((route, index) => ({
    url: new URL(route || "/", baseUrl).toString(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/pilot" ? 0.9 : 0.7,
  }));
}
