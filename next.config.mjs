/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow ngrok domain for development (both .app and .dev)
  allowedDevOrigins: [
    'gesticulative-unmercenarily-debra.ngrok-free.app',
    'gesticulative-unmercenarily-debra.ngrok-free.dev',
  ],
}

export default nextConfig
