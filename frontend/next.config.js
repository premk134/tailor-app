/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  images: {
    domains: ['localhost', 's3.amazonaws.com'],
  },
}

module.exports = nextConfig
