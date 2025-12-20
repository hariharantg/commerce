export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'www.thamboolambags.com',
        pathname: '/**'
      }
    ]
  }
};
