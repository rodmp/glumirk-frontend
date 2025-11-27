import { useEffect, useState } from 'react'
import { Grid, Paper, Typography, Box } from '@mui/material'
import { salesAPI, inventoryAPI } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    dailySales: 0,
    totalItems: 0,
    lowStock: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dailySales, inventory, lowStock] = await Promise.all([
          salesAPI.getDaily(),
          inventoryAPI.getAll({ limit: 1000 }),
          inventoryAPI.getLowStock(10),
        ])

        setStats({
          dailySales: dailySales.data.total_sales || 0,
          totalItems: inventory.data.length || 0,
          lowStock: lowStock.data.length || 0,
          totalRevenue: dailySales.data.total_revenue || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ title, value, subtitle }) => (
    <Paper 
      sx={{ 
        p: 3, 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)',
        },
      }}
    >
      <Typography 
        variant="h4" 
        component="div" 
        gutterBottom
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  )

  if (loading) {
    return <Typography>Cargando...</Typography>
  }

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ventas Hoy"
            value={stats.dailySales}
            subtitle={`$${stats.totalRevenue.toFixed(2)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Artículos" value={stats.totalItems} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stock Bajo"
            value={stats.lowStock}
            subtitle="Artículos con stock ≤ 10"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ingresos Hoy"
            value={`$${stats.totalRevenue.toFixed(2)}`}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

