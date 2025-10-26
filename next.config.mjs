/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable ESLint during build for Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable webpack caching for better performance
  webpack: (config, { isServer, dev }) => {
    // Re-enable caching for performance (was disabled for sync conflicts)
    // config.cache = false; // REMOVED - hurts performance

    // Faster incremental builds in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config;
  },
  // Production optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize page data fetching
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Faster HMR in development
    turbo: process.env.NODE_ENV === 'development' ? {} : undefined,
  },
  // Faster development reloads
  reactStrictMode: false, // Disable in dev for faster HMR (re-enable for production testing)
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
