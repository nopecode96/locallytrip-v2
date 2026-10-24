/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'locallytrip.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/vibes/meetups',
        destination: '/id/community/meetups',
        permanent: true,
      },
      {
        source: '/vibes/forums',
        destination: '/id/community/forums',
        permanent: true,
      },
      {
        source: '/vibes',
        destination: '/id/community',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
