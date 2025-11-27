import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid } from '@mui/material'
import { salesAPI } from '../services/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function Reports() {
  const [dailyData, setDailyData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDailyReport()
  }, [])

  const fetchDailyReport = async () => {
    try {
      const response = await salesAPI.getDaily()
      setDailyData(response.data)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Typography>Cargando reportes...</Typography>
  }

  const chartData = [
    { name: 'Hoy', ventas: dailyData?.total_sales || 0, ingresos: dailyData?.total_revenue || 0 },
  ]

  return (
    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', p: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Reportes
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(5px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ventas del Día
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ventas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(5px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ingresos del Día
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper 
        sx={{ 
          p: 3, 
          mt: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Resumen del Día
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Total de Ventas
            </Typography>
            <Typography variant="h5">{dailyData?.total_sales || 0}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Artículos Vendidos
            </Typography>
            <Typography variant="h5">{dailyData?.total_items_sold || 0}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Ingresos Totales
            </Typography>
            <Typography variant="h5">
              ${(dailyData?.total_revenue || 0).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

