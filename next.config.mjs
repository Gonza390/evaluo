/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ai.google.dev',
      },
    ],
  },
  serverExternalPackages: ['@google/generative-ai'],
};

export default nextConfig;
