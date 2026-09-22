/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || '.next',
  outputFileTracingIncludes: {
    // PDF.js resolves its fake worker at runtime in Node, so Next.js tracing
    // must ship it with every route that can execute the PDF processing pipeline.
    // Keep this list explicit: a global '/*' duplicates the worker across unrelated
    // server functions and dramatically increases Vercel Functions Storage.
    '/dashboard': [
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/node_modules/@napi-rs/**/*',
    ],
    '/materiales/*': [
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/node_modules/@napi-rs/**/*',
    ],
    '/api/internal/student-material-jobs': [
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/node_modules/@napi-rs/**/*',
    ],
    '/api/pdf-thumbnail': [
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/node_modules/@napi-rs/**/*',
    ],
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      'https://va.vercel-scripts.com',
      'https://www.googletagmanager.com',
      'https://www.clarity.ms',
      'https://scripts.clarity.ms',
    ].join(' ');

    const contentSecurityPolicy = [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https://d2ol7oe51mr4n9.cloudfront.net",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${scriptSrc}`,
      "connect-src 'self' https://*.supabase.co https://api.groq.com https://generativelanguage.googleapis.com https://va.vercel-scripts.com https://www.google-analytics.com https://region1.google-analytics.com https://www.google.com https://www.clarity.ms",
      "frame-src 'self' blob: https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: false,
    deviceSizes: [360, 390, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 224, 256, 320, 384, 448, 512],
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
  serverExternalPackages: [
    '@google/generative-ai',
    'pdfjs-dist',
  ],
};

export default nextConfig;