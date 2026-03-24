/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase API route body size limit for image uploads
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },

  // Webpack configuration for Solidity compilation
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle Solidity files
    config.module.rules.push({
      test: /\.sol$/,
      use: 'raw-loader',
    });

    return config;
  },
};

module.exports = nextConfig;