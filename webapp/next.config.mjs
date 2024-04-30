/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/signup',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
