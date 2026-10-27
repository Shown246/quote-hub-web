/** @type {import("next").NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://quotehub-prod.eastus.cloudapp.azure.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
