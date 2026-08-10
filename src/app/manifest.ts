import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TraceTutor — TOEFL Reading Correction Sprint",
    short_name: "TraceTutor",
    description:
      "Tutor-verified daily mistake correction for independent TOEFL Reading practice.",
    start_url: "/student/today",
    display: "standalone",
    background_color: "#f7f2e9",
    theme_color: "#7455d9",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
