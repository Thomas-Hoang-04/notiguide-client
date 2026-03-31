import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.7', '192.168.204.189'],
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
