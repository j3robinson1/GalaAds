/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, 
  images: {
    domains: ['*'],
  },
  async headers() {
    return [
      {
        source: "/ad-frame",
        headers: [
          { key: 'X-Header', value: 'value' }
        ],
      },
    ]
  }
};

module.exports = nextConfig;
