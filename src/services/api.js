import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación y seguridad
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail || error.message

    // Manejo de errores de autenticación
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Manejo de rate limiting (429 Too Many Requests)
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after']
      const message = detail || 'Demasiadas peticiones. Por favor espera un momento antes de intentar nuevamente.'
      const retryMessage = retryAfter 
        ? `${message} Intenta nuevamente en ${retryAfter} segundos.`
        : message
      
      // Crear error personalizado con información de retry
      const rateLimitError = new Error(retryMessage)
      rateLimitError.status = 429
      rateLimitError.retryAfter = retryAfter
      return Promise.reject(rateLimitError)
    }

    // Manejo de request too large (413)
    if (status === 413) {
      const sizeError = new Error('La petición es demasiado grande. Por favor reduce el tamaño de los datos.')
      sizeError.status = 413
      return Promise.reject(sizeError)
    }

    // Manejo de forbidden (403)
    if (status === 403) {
      const forbiddenError = new Error(detail || 'No tienes permisos para realizar esta acción.')
      forbiddenError.status = 403
      return Promise.reject(forbiddenError)
    }

    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
}

// Items
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getByBarcode: (barcode) => api.get(`/items/${barcode}`),
  create: (itemData) => api.post('/items', itemData),
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  delete: (id) => api.delete(`/items/${id}`),
}

// Sales
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  create: (salesData) => api.post('/sales', salesData), // Ahora recibe { items: [...], device_id?, user_id? }
  createSingle: (saleData) => api.post('/sales/single', saleData), // Endpoint individual para compatibilidad
  getReport: (params) => api.get('/sales/report', { params }),
  getDaily: () => api.get('/sales/daily'),
}

// Inventory
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  update: (updateData) => api.post('/inventory/update', updateData),
  getLowStock: (threshold) => api.get('/inventory/low-stock', { params: { threshold } }),
}

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
}

// Categories
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Brands
export const brandsAPI = {
  getAll: (params) => api.get('/brands', { params }),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
}

// Roles
export const rolesAPI = {
  getAll: (params) => api.get('/roles', { params }),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
}

export default api

