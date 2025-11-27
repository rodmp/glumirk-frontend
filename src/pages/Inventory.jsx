import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { itemsAPI, categoriesAPI, brandsAPI } from '../services/api'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category_id: '',
    brand_id: '',
    cost: '',
    price: '',
    stock: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchBrands()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll()
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await brandsAPI.getAll()
      setBrands(response.data)
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        barcode: item.barcode,
        name: item.name,
        category_id: item.category_id || '',
        brand_id: item.brand_id || '',
        cost: item.cost || '',
        price: item.price,
        stock: item.stock,
      })
    } else {
      setEditingItem(null)
      setFormData({
        barcode: '',
        name: '',
        category_id: '',
        brand_id: '',
        cost: '',
        price: '',
        stock: '',
      })
    }
    setOpen(true)
    setError('')
  }

  const handleClose = () => {
    setOpen(false)
    setEditingItem(null)
    setError('')
  }

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
      }

      if (editingItem) {
        await itemsAPI.update(editingItem.id, data)
      } else {
        await itemsAPI.create(data)
      }

      handleClose()
      fetchItems()
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al guardar el artículo')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este artículo?')) {
      try {
        await itemsAPI.delete(id)
        fetchItems()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventario</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{
            py: 1.2,
            px: 3,
            fontSize: '0.95rem',
            fontWeight: 600,
          }}
        >
          Nuevo Artículo
        </Button>
      </Box>

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
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category || '-'}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpen(item)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(item.id)}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Código de Barras"
            fullWidth
            required
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            disabled={!!editingItem}
          />
          <TextField
            margin="dense"
            label="Nombre"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.category_id}
              label="Categoría"
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <MenuItem value="">
                <em>Ninguna</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Marca</InputLabel>
            <Select
              value={formData.brand_id}
              label="Marca"
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
            >
              <MenuItem value="">
                <em>Ninguna</em>
              </MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Costo"
            type="number"
            fullWidth
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Precio"
            type="number"
            fullWidth
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Stock"
            type="number"
            fullWidth
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
            sx={{
              py: 1,
              px: 3,
              fontWeight: 600,
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

