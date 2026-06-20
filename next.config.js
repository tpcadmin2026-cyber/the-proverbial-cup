/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 key — becomes top-level serverExternalPackages in Next.js 15
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.backblazeb2.com' },
    ],
  },
}

module.exports = nextConfig
