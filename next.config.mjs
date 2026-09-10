/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  eslint: {
    // Lint runs in CI and `next build`. Keep it honest.
    dirs: ["app", "components", "lib", "hooks"],
  },
};

export default nextConfig;
