import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // macOS may sync Documents through iCloud and restore stale `.next` files as
  // conflict copies. Keep local generated output in a `.nosync` directory;
  // Vercel retains its conventional build directory.
  distDir: process.env.VERCEL ? ".next" : ".next.nosync",
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
