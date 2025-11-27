import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  PointOfSale as SalesIcon,
  Assessment as ReportsIcon,
  People as UsersIcon,
  Category as CategoryIcon,
  BrandingWatermark as BrandIcon,
  AdminPanelSettings as RolesIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { canViewPage } from '../utils/permissions'
import '../styles/paperBackground.css'

const drawerWidth = 240

const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Ventas', icon: <SalesIcon />, path: '/sales' },
  { text: 'Reportes', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Categorías', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Marcas', icon: <BrandIcon />, path: '/brands' },
  { text: 'Usuarios', icon: <UsersIcon />, path: '/users' },
  { text: 'Roles', icon: <RolesIcon />, path: '/roles' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  
  // Filtrar menú según permisos del usuario
  const menuItems = allMenuItems.filter(item => canViewPage(user, item.path))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }} className="paper-background">
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            📚 Glumirk
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#ffffff',
            backdropFilter: 'blur(20px)',
            borderRight: '2px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            position: 'relative',
          },
        }}
      >
        <Toolbar 
          sx={{ 
            background: '#ffffff',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        />
        <Box sx={{ overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    backgroundColor: location.pathname === item.path 
                      ? 'rgba(102, 126, 234, 0.15)' 
                      : 'transparent',
                    border: location.pathname === item.path 
                      ? '1px solid rgba(102, 126, 234, 0.3)' 
                      : '1px solid transparent',
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    '& .MuiListItemIcon-root': {
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.3s ease',
                    },
                    '& .MuiListItemText-primary': {
                      color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      transform: 'translateX(4px)',
                    },
                    '&:hover .MuiListItemIcon-root': {
                      color: 'primary.main',
                      transform: 'scale(1.15)',
                    },
                    '&:hover .MuiListItemText-primary': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon className="modern-icon" sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1, borderColor: 'rgba(0, 0, 0, 0.1)' }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={handleLogout}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    transform: 'translateX(4px)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'error.main',
                  },
                  '&:hover .MuiListItemIcon-root': {
                    color: 'error.main',
                    transform: 'scale(1.15)',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'text.primary',
                  },
                  '&:hover .MuiListItemText-primary': {
                    color: 'error.main',
                  },
                }}
              >
                <ListItemIcon className="modern-icon" sx={{ minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Cerrar Sesión"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          position: 'relative',
        }}
        className="paper-content"
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}

