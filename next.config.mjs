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
  // Optimize for cloud-synced folders (Dropbox, OneDrive, etc.)
  experimental: {
    // Disable some caching features that conflict with cloud sync
    isrMemoryCacheSize: 0,
  },
  // Disable webpack caching to avoid file sync conflicts
  webpack: (config, { isServer }) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
