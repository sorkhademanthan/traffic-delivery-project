import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Add,
  Refresh,
  Edit,
  Delete,
  DirectionsCar,
  TwoWheeler,
  LocalShipping,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDrivers, deleteDriver } from './driversSlice';
import { Driver } from '../../types/api.types';
import DriverForm from './DriverForm';
import toast from 'react-hot-toast';

const DriverList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { drivers, loading } = useAppSelector((state) => state.drivers);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      const result = await dispatch(deleteDriver(id));
      if (deleteDriver.fulfilled.match(result)) {
        toast.success('Driver deleted successfully');
      }
    }
  };

  const getStatusColor = (status: Driver['status']) => {
    const colors = {
      AVAILABLE: 'success',
      ON_ROUTE: 'info',
      OFF_DUTY: 'default',
      UNAVAILABLE: 'error',
    };
    return colors[status] as any;
  };

  const getVehicleIcon = (vehicleType: Driver['vehicleType']) => {
    const icons = {
      BIKE: <TwoWheeler />,
      SCOOTER: <TwoWheeler />,
      CAR: <DirectionsCar />,
      VAN: <LocalShipping />,
      TRUCK: <LocalShipping />,
    };
    return icons[vehicleType];
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Driver',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {params.row.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'vehicleType',
      headerName: 'Vehicle',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getVehicleIcon(params.value)}
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedDriver(params.row as Driver);
                setFormOpen(true);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
              <Delete fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Drivers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedDriver(null);
              setFormOpen(true);
            }}
          >
            Add Driver
          </Button>
          <IconButton onClick={() => dispatch(fetchDrivers())}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search drivers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      <Card>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredDrivers}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
          />
        </div>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
        <DialogContent>
          <DriverForm
            driver={selectedDriver}
            onSuccess={() => {
              setFormOpen(false);
              dispatch(fetchDrivers());
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DriverList;