import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  typescript: {
		ignoreBuildErrors: false,
	},
	reactStrictMode: true,
};

export default nextConfig;
