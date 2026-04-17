/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    optimizePackageImports: ['react-icons/fa', 'react-icons/md'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config) => {
    // Suppress "Managed item ... isn't a directory" warnings for optional @next/swc-* platform packages
    config.infrastructureLogging = { level: 'error' }
    return config
  },
}

module.exports = nextConfig

