import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))

  useEffect(() => {
    const expire = () => setToken(null)
    window.addEventListener('auth:expired', expire)
    return () => window.removeEventListener('auth:expired', expire)
  }, [])

  const value = useMemo(() => ({
    token,
    login(accessToken) {
      localStorage.setItem('access_token', accessToken)
      setToken(accessToken)
    },
    logout() {
      localStorage.removeItem('access_token')
      setToken(null)
    },
  }), [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
