import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AZURE_VISION_KEY: process.env.AZURE_VISION_KEY,
    AZURE_VISION_ENDPOINT: process.env.AZURE_VISION_ENDPOINT,
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

export default nextConfig