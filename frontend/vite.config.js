import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), '')
    const apiBaseUrl = env.VITE_API_BASE_URL?.trim()

    if (!apiBaseUrl || apiBaseUrl.includes('placeholder.invalid')) {
      throw new Error('VITE_API_BASE_URL must be set to the deployed FastAPI origin for production builds.')
    }

    let parsedUrl
    try {
      parsedUrl = new URL(apiBaseUrl)
    } catch {
      throw new Error('VITE_API_BASE_URL must be a valid absolute URL.')
    }
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('VITE_API_BASE_URL must use HTTPS in production.')
    }
  }

  return { plugins: [react()] }
})
