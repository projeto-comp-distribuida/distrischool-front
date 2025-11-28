/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.7:8080',
    NEXT_PUBLIC_AUTH_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://192.168.1.7:8080/api/v1/auth',
    NEXT_PUBLIC_STUDENT_SERVICE_URL: process.env.NEXT_PUBLIC_STUDENT_SERVICE_URL || 'http://192.168.1.7:8081',
    NEXT_PUBLIC_TEACHER_SERVICE_URL: process.env.NEXT_PUBLIC_TEACHER_SERVICE_URL || 'http://192.168.1.7:8082',
    NEXT_PUBLIC_GRADES_API_URL: process.env.NEXT_PUBLIC_GRADES_API_URL || 'http://192.168.1.7:8083',
    NEXT_PUBLIC_CLASSES_API_URL: process.env.NEXT_PUBLIC_CLASSES_API_URL || 'http://192.168.1.7:8084',
  },
  // produce the standalone server.js bundle used by the Docker image
  output: 'standalone',
}

export default nextConfig