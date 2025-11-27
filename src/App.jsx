import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import Roles from './pages/Roles'
import Layout from './components/Layout'
import { canViewPage } from './utils/permissions'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function ProtectedRoute({ children, path }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (!canViewPage(user, path || location.pathname)) {
    return <Navigate to="/" />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
          <Route path="inventory" element={<ProtectedRoute path="/inventory"><Inventory /></ProtectedRoute>} />
          <Route path="sales" element={<ProtectedRoute path="/sales"><Sales /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute path="/reports"><Reports /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute path="/users"><Users /></ProtectedRoute>} />
          <Route path="categories" element={<ProtectedRoute path="/categories"><Categories /></ProtectedRoute>} />
          <Route path="brands" element={<ProtectedRoute path="/brands"><Brands /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute path="/roles"><Roles /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

