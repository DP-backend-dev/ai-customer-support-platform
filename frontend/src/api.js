import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) console.warn('VITE_API_BASE_URL is not configured')

export const api = axios.create({ baseURL })
export const publicApi = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.dispatchEvent(new Event('auth:expired'))
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error.response) return 'Unable to reach the server. Check your connection and try again.'
  const detail = error.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg?.replace(/^Value error, /, '')).filter(Boolean).join(' ') || fallback
  }
  return fallback
}
