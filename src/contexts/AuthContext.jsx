import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authAPI.getMe()
      const userData = response.data
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user:', error)
      // Si hay error, limpiar datos
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (storedUser && token) {
      // Cargar usuario del storage mientras se obtiene del servidor
      setUser(JSON.parse(storedUser))
      // Actualizar desde el servidor
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      
      // Get user info from /me endpoint
      const userResponse = await authAPI.getMe()
      const userData = userResponse.data
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      // Manejo específico de errores de seguridad
      let errorMessage = 'Error al iniciar sesión'
      
      if (error.status === 429) {
        // Rate limiting - demasiados intentos
        errorMessage = error.message || 'Demasiados intentos de login. Por favor espera unos minutos antes de intentar nuevamente.'
      } else if (error.response?.status === 401) {
        // Credenciales incorrectas
        errorMessage = 'Correo electrónico o contraseña incorrectos'
      } else if (error.response?.status === 403) {
        // Acceso prohibido
        errorMessage = 'Acceso denegado. Contacta al administrador.'
      } else if (error.response?.data?.detail) {
        // Mensaje del servidor
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

