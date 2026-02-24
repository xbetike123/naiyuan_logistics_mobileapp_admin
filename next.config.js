/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs BEFORE filesystem (pages/api routes) are checked
      // This is not needed for local routes — they are handled by Next.js automatically
      
      // afterFiles runs AFTER filesystem check — only unmatched routes get proxied
      // This means /api/admin-login and /api/admin-verify (which exist as files)
      // are served locally, and everything else proxies to the backend
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL || 'http://localhost:3000'}/api/v1/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
