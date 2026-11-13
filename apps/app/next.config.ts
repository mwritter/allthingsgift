import type { NextConfig } from "next";

import { basePath } from "./lib/base-path";

const API_URL = `${process.env.API_URL ?? "http://localhost:8080"}`;

const nextConfig: NextConfig = {
  basePath,
  transpilePackages: ["@allthingsgift/types", "@allthingsgift/ui"],

  async rewrites() {
    return [
      {
        // The API stays at the site root. basePath would otherwise prefix this
        // to /dashboard/api, which the Go service and the client do not use.
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
