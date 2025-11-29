/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net',
    NEXT_PUBLIC_AUTH_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://distrischool.ddns.net/api/v1/auth',
    NEXT_PUBLIC_STUDENT_SERVICE_URL: process.env.NEXT_PUBLIC_STUDENT_SERVICE_URL || 'http://distrischool.ddns.net/api/v1/students',
    NEXT_PUBLIC_TEACHER_SERVICE_URL: process.env.NEXT_PUBLIC_TEACHER_SERVICE_URL || 'http://distrischool.ddns.net/api/teachers',
    NEXT_PUBLIC_TEACHER_MANAGEMENT_SERVICE_URL: process.env.NEXT_PUBLIC_TEACHER_MANAGEMENT_SERVICE_URL || 'http://distrischool.ddns.net/api/v1/teacher-management',
    NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://distrischool.ddns.net/api/v1/notifications',
  },
}

export default nextConfig