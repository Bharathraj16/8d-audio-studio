/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.248.202.92', 'localhost', '127.0.0.1'],
  reactStrictMode: false,
  // Turbopack config for Next.js 16
  turbopack: {
    // Empty config to silence the warning
  },
}

module.exports = nextConfig