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
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { rolesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canDelete } from '../utils/permissions'

export default function Roles() {
  const { user } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getAll()
      setRoles(response.data)
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (role = null) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
      })
    }
    setOpen(true)
    setError('')
  }

  const handleClose = () => {
    setOpen(false)
    setEditingRole(null)
    setError('')
  }

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await rolesAPI.update(editingRole.id, formData)
      } else {
        await rolesAPI.create(formData)
      }

      handleClose()
      fetchRoles()
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al guardar el rol')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await rolesAPI.delete(id)
        fetchRoles()
      } catch (error) {
        console.error('Error deleting role:', error)
        alert(error.response?.data?.detail || 'Error al eliminar el rol')
      }
    }
  }

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Roles</Typography>
        {canCreate(user, 'roles') && (
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
            Nuevo Rol
          </Button>
        )}
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
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description || '-'}</TableCell>
                <TableCell>
                  {canUpdate(user, 'roles') && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpen(role)}
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
                  )}
                  {canDelete(user, 'roles') && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(role.id)}
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
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Nombre"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={editingRole !== null} // No permitir editar nombre si ya existe
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

