import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import { Add, Delete, ShoppingCart, CheckCircle } from '@mui/icons-material'
import { salesAPI, itemsAPI, usersAPI } from '../services/api'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { canCreate } from '../utils/permissions'

export default function Sales() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    barcode: '',
    quantity: '1',
    device_id: '',
    user_id: '',
  })
  const [selectedItem, setSelectedItem] = useState(null)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cart, setCart] = useState([]) // Carrito de compras
  const [processingSale, setProcessingSale] = useState(false)

  useEffect(() => {
    fetchSales()
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({ limit: 100 })
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll({ limit: 100 })
      setSales(response.data)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    setFormData({
      barcode: '',
      quantity: '1',
      device_id: '',
      user_id: '',
    })
    setSelectedItem(null)
    setCart([]) // Limpiar carrito al abrir
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedItem(null)
    setCart([]) // Limpiar carrito al cerrar
    setError('')
    setSuccess('')
  }

  const handleBarcodeChange = async (barcode) => {
    setFormData({ ...formData, barcode })
    setError('')
    setSelectedItem(null)
    
    if (barcode.length >= 3) {
      setLoadingItem(true)
      try {
        const response = await itemsAPI.getByBarcode(barcode)
        setSelectedItem(response.data)
      } catch (error) {
        if (error.response?.status === 404) {
          setError('Artículo no encontrado')
        } else {
          setError('Error al buscar el artículo')
        }
        setSelectedItem(null)
      } finally {
        setLoadingItem(false)
      }
    }
  }

  // Agregar item al carrito
  const handleAddToCart = () => {
    try {
      setError('')
      
      if (!formData.barcode) {
        setError('El código de barras es requerido')
        return
      }

      if (!selectedItem) {
        setError('Por favor busca y selecciona un artículo válido')
        return
      }

      const quantity = parseInt(formData.quantity)
      if (!quantity || quantity <= 0) {
        setError('La cantidad debe ser mayor a 0')
        return
      }

      if (quantity > selectedItem.stock) {
        setError(`Stock insuficiente. Stock disponible: ${selectedItem.stock}`)
        return
      }

      // Verificar si el item ya está en el carrito
      const existingCartItem = cart.find(item => item.barcode === selectedItem.barcode)
      
      if (existingCartItem) {
        // Si ya existe, actualizar la cantidad
        const newQuantity = existingCartItem.quantity + quantity
        if (newQuantity > selectedItem.stock) {
          setError(`Stock insuficiente. Stock disponible: ${selectedItem.stock}, ya tienes ${existingCartItem.quantity} en el carrito`)
          return
        }
        setCart(cart.map(item => 
          item.barcode === selectedItem.barcode 
            ? { ...item, quantity: newQuantity }
            : item
        ))
      } else {
        // Si no existe, agregarlo
        setCart([...cart, {
          barcode: selectedItem.barcode,
          name: selectedItem.name,
          price: selectedItem.price,
          stock: selectedItem.stock,
          quantity: quantity,
          item: selectedItem
        }])
      }

      // Limpiar formulario
      setFormData({ ...formData, barcode: '', quantity: '1' })
      setSelectedItem(null)
      setSuccess('Producto agregado al carrito')
      
      // Limpiar mensaje de éxito después de 2 segundos
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      setError('Error al agregar al carrito')
    }
  }

  // Eliminar item del carrito
  const handleRemoveFromCart = (barcode) => {
    setCart(cart.filter(item => item.barcode !== barcode))
  }

  // Actualizar cantidad en el carrito
  const handleUpdateCartQuantity = (barcode, newQuantity) => {
    const cartItem = cart.find(item => item.barcode === barcode)
    if (!cartItem) return

    const quantity = parseInt(newQuantity)
    if (quantity <= 0) {
      handleRemoveFromCart(barcode)
      return
    }

    if (quantity > cartItem.stock) {
      setError(`Stock insuficiente. Stock disponible: ${cartItem.stock}`)
      return
    }

    setCart(cart.map(item => 
      item.barcode === barcode 
        ? { ...item, quantity: quantity }
        : item
    ))
    setError('')
  }

  // Calcular total del carrito
  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Finalizar venta
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío')
      return
    }

    try {
      setError('')
      setSuccess('')
      setProcessingSale(true)

      // Crear request con todos los items del carrito
      const salesData = {
        items: cart.map(item => ({
          barcode: item.barcode,
          quantity: item.quantity,
        })),
        device_id: formData.device_id || null,
        user_id: formData.user_id || null,
      }

      const response = await salesAPI.create(salesData)
      
      // El endpoint ahora retorna un arreglo de ventas
      const createdSales = response.data
      if (createdSales && createdSales.length > 0) {
        const totalAmount = createdSales.reduce((sum, sale) => sum + sale.total, 0)
        setSuccess(`Venta completada exitosamente. ${createdSales.length} producto(s) vendido(s). Total: $${totalAmount.toFixed(2)}`)
      } else {
        setSuccess('Venta registrada exitosamente')
      }
      
      // Limpiar carrito y formulario
      setCart([])
      setFormData({ ...formData, barcode: '', quantity: '1' })
      setSelectedItem(null)
      
      // Refresh sales list y cerrar después de 2 segundos
      setTimeout(() => {
        fetchSales()
        handleClose()
      }, 2000)
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al registrar la venta')
    } finally {
      setProcessingSale(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      sale.item?.name?.toLowerCase().includes(searchTerm) ||
      sale.item?.barcode?.toLowerCase().includes(searchTerm) ||
      sale.user?.name?.toLowerCase().includes(searchTerm) ||
      sale.user?.email?.toLowerCase().includes(searchTerm) ||
      sale.device_id?.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ventas</Typography>
        {canCreate(user, 'sales') && (
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleOpen}
            sx={{
              py: 1.2,
              px: 3,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            Nueva Venta
          </Button>
        )}
      </Box>

      <TextField
        label="Buscar"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <TableContainer 
        component={Paper}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Artículo</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Precio Unit.</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Dispositivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {format(new Date(sale.sold_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{sale.item?.name || '-'}</TableCell>
                <TableCell>{sale.item?.barcode || '-'}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>${sale.price.toFixed(2)}</TableCell>
                <TableCell>${sale.total.toFixed(2)}</TableCell>
                <TableCell>{sale.user?.name || sale.user?.email || '-'}</TableCell>
                <TableCell>{sale.device_id || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            <Typography variant="h6">Nueva Venta</Typography>
            {cart.length > 0 && (
              <Box sx={{ 
                ml: 'auto', 
                backgroundColor: 'primary.main', 
                color: 'white', 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                {cart.length} {cart.length === 1 ? 'artículo' : 'artículos'}
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Sección de búsqueda y agregar al carrito */}
          <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Agregar Producto
            </Typography>
            
            <TextField
              margin="dense"
              label="Código de Barras"
              fullWidth
              value={formData.barcode}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              sx={{ mb: 2 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && selectedItem) {
                  handleAddToCart()
                }
              }}
            />

            {loadingItem && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {selectedItem && (
              <Box 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  backgroundColor: 'rgba(102, 126, 234, 0.1)', 
                  borderRadius: 1,
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedItem.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Precio: ${selectedItem.price.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stock disponible: {selectedItem.stock}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="dense"
                label="Cantidad"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                inputProps={{ min: 1, max: selectedItem?.stock || 9999 }}
                error={selectedItem && parseInt(formData.quantity) > selectedItem.stock}
                helperText={
                  selectedItem && parseInt(formData.quantity) > selectedItem.stock
                    ? `Stock insuficiente. Máximo: ${selectedItem.stock}`
                    : selectedItem
                    ? `Total: $${(selectedItem.price * (parseInt(formData.quantity) || 0)).toFixed(2)}`
                    : ''
                }
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddToCart}
                disabled={!selectedItem || loadingItem}
                sx={{
                  mt: 1,
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                }}
              >
                Agregar al Carrito
              </Button>
            </Box>
          </Box>

          {/* Carrito de compras */}
          {cart.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Carrito de Compras
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="center" sx={{ width: 120 }}>Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center" sx={{ width: 60 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.barcode}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.barcode}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartQuantity(item.barcode, e.target.value)}
                            inputProps={{ min: 1, max: item.stock }}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFromCart(item.barcode)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            <Delete fontSize="small" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 1,
                border: '1px solid rgba(102, 126, 234, 0.2)',
              }}>
                <Typography variant="h6" fontWeight={600}>
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${calculateCartTotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Opciones adicionales */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <TextField
              margin="dense"
              label="Usuario (Opcional)"
              select
              fullWidth
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Dejar vacío para usar el usuario actual. Solo administradores pueden asignar a otros usuarios."
            >
              <MenuItem value="">
                <em>Usuario actual</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              margin="dense"
              label="ID de Dispositivo (Opcional)"
              fullWidth
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose}
            disabled={processingSale}
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          {cart.length > 0 && (
            <Button 
              onClick={handleFinalizeSale} 
              variant="contained"
              disabled={processingSale || cart.length === 0}
              startIcon={processingSale ? <CircularProgress size={16} /> : <CheckCircle />}
              sx={{
                py: 1,
                px: 3,
                fontWeight: 600,
              }}
            >
              {processingSale ? 'Procesando...' : `Finalizar Venta (${cart.length} ${cart.length === 1 ? 'artículo' : 'artículos'})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

