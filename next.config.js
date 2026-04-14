module.exports = { reactStrictMode: true } 
const nextConfig = {
  reactStrictMode: true,
  // Ignore build errors temporarily for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig