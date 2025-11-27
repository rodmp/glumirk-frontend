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
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { salesAPI, itemsAPI } from '../services/api'
import { format } from 'date-fns'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    barcode: '',
    quantity: '1',
    device_id: '',
  })
  const [selectedItem, setSelectedItem] = useState(null)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

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
    })
    setSelectedItem(null)
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedItem(null)
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

  const handleSubmit = async () => {
    try {
      setError('')
      setSuccess('')
      
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

      const saleData = {
        barcode: formData.barcode,
        quantity: quantity,
        device_id: formData.device_id || null,
      }

      await salesAPI.create(saleData)
      setSuccess('Venta registrada exitosamente')
      
      // Refresh sales list
      setTimeout(() => {
        fetchSales()
        handleClose()
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al registrar la venta')
    }
  }

  const filteredSales = sales.filter((sale) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      sale.item?.name?.toLowerCase().includes(searchTerm) ||
      sale.item?.barcode?.toLowerCase().includes(searchTerm) ||
      sale.device_id?.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ventas</Typography>
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
                <TableCell>{sale.device_id || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Venta</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            label="Código de Barras"
            fullWidth
            required
            value={formData.barcode}
            onChange={(e) => handleBarcodeChange(e.target.value)}
            sx={{ mb: 2 }}
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

          <TextField
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            required
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
          />

          <TextField
            margin="dense"
            label="ID de Dispositivo (Opcional)"
            fullWidth
            value={formData.device_id}
            onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!selectedItem || loadingItem}
            sx={{
              py: 1,
              px: 3,
              fontWeight: 600,
            }}
          >
            Registrar Venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

