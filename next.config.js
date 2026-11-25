/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["playwright-core", "@sparticuz/chromium", "unpdf"],
    outputFileTracingIncludes: {
      "/api/run": ["./node_modules/@sparticuz/chromium/bin/**"],
      "/api/cek": ["./node_modules/@sparticuz/chromium/bin/**"],
    },
  },
};

module.exports = nextConfig;
