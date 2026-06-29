import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");
config({ path: resolve(repoRoot, ".env.local") });
config({ path: resolve(repoRoot, ".env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
