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
  // ⚡ PERFORMANCE: Enable webpack caching for better performance
  webpack: (config, { isServer, dev }) => {
    // Enable persistent caching (disabled in production for freshness)
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: false, // Faster caching without compression
      };
    }

    // Faster incremental builds in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        runtimeChunk: false, // Disable runtime chunk for faster dev
      };

      // Reduce module resolution time
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
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
    // ⚡ TURBOPACK: Faster development with Turbopack (Next.js 14+)
    // Disabled for now to ensure compatibility
    // turbo: process.env.NODE_ENV === 'development' ? {} : undefined,
  },
  // ⚡ PERFORMANCE: Disable strict mode for faster HMR in dev
  reactStrictMode: false, // Disable in dev for faster HMR (re-enable for production testing)

  // ⚡ PERFORMANCE: Optimize server-side rendering
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000, // 1 minute
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5, // Reduced from default to save memory
  },

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
