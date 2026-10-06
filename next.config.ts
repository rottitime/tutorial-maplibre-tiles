import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // MapLibre's GeoJSON worker is killed mid-load by Strict Mode's
  // mount→unmount→remount cycle when ingesting ~100MB+ files in dev.
  reactStrictMode: false,
};

export default nextConfig;
