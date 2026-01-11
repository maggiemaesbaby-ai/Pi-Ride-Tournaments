/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
}

export default nextConfig
