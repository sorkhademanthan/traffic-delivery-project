import React, { useEffect, useState } from 'react';
import { Grid as Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { LocalShipping, Assignment, People, TrendingUp } from '@mui/icons-material';
import apiClient from '../../api/client';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalDrivers: number;
  availableDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, drivers, routes] = await Promise.all([
          apiClient.get('/orders/stats'),
          apiClient.get('/drivers/stats'),
          apiClient.get('/routes/stats'),
        ]);

        setStats({
          totalOrders: orders.data.stats.total,
          pendingOrders: orders.data.stats.pending,
          totalDrivers: drivers.data.stats.total,
          availableDrivers: drivers.data.stats.available,
          totalRoutes: routes.data.stats.total,
          activeRoutes: routes.data.stats.inProgress,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Total Orders</Typography>
                  <Typography variant="h4">{stats?.totalOrders || 0}</Typography>
                  <Typography variant="caption">{stats?.pendingOrders || 0} pending</Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Drivers</Typography>
                  <Typography variant="h4">{stats?.totalDrivers || 0}</Typography>
                  <Typography variant="caption" color="success.main">{stats?.availableDrivers || 0} available</Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Routes</Typography>
                  <Typography variant="h4">{stats?.totalRoutes || 0}</Typography>
                  <Typography variant="caption" color="warning.main">{stats?.activeRoutes || 0} active</Typography>
                </Box>
                <LocalShipping color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Efficiency</Typography>
                  <Typography variant="h4">92%</Typography>
                  <Typography variant="caption" color="success.main">+5% from last week</Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;