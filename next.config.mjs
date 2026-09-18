/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sharp', 'pdf-lib', '@pdf-lib/fontkit'],
  outputFileTracingIncludes: { '/api/sheet-pdf': ['./public/fonts/**/*'] },
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
};
export default nextConfig;
