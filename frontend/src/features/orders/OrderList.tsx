import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  FilterList,
  Download,
  Map as MapIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, deleteOrder } from './ordersSlice';
import { Order } from '../../types/api.types';
import CSVUpload from './CSVUpload';
import OrderForm from './OrderForm';
import OrderMap from '../../components/maps/OrderMap';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const OrderList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showMap, setShowMap] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const result = await dispatch(deleteOrder(id));
      if (deleteOrder.fulfilled.match(result)) {
        toast.success('Order deleted successfully');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Phone', 'Address', 'City', 'Status', 'Priority', 'Created'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.address,
      o.city,
      o.status,
      o.priority,
      format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      PENDING: 'error',
      ASSIGNED: 'warning',
      IN_TRANSIT: 'info',
      DELIVERED: 'success',
      FAILED: 'default',
      CANCELLED: 'default',
    };
    return colors[status] as any;
  };

  const getPriorityColor = (priority: Order['priority']) => {
    const colors = {
      LOW: 'default',
      NORMAL: 'info',
      HIGH: 'warning',
      URGENT: 'error',
    };
    return colors[priority] as any;
  };

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order #', width: 130 },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    { field: 'customerPhone', headerName: 'Phone', width: 130 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getPriorityColor(params.value)} size="small" />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, HH:mm'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => setSelectedOrder(params.row as Order)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => {
              setSelectedOrder(params.row as Order);
              setFormOpen(true);
            }}>
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Orders</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <CSVUpload onSuccess={() => dispatch(fetchOrders())} />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedOrder(null);
              setFormOpen(true);
            }}
          >
            Add Order
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="ASSIGNED">Assigned</MenuItem>
                  <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <MenuItem value="ALL">All Priorities</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button startIcon={<MapIcon />} onClick={() => setShowMap(!showMap)}>
                {showMap ? 'Hide' : 'Show'} Map
              </Button>
              <Button startIcon={<Download />} onClick={handleExportCSV}>Export</Button>
              <IconButton onClick={() => dispatch(fetchOrders())}>
                <Refresh />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {showMap && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <OrderMap orders={filteredOrders} height="400px" />
          </CardContent>
        </Card>
      )}

      <Card>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredOrders}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </div>
      </Card>

      {/* Order Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedOrder ? 'Edit Order' : 'Create Order'}</DialogTitle>
        <DialogContent>
          <OrderForm
            order={selectedOrder}
            onSuccess={() => {
              setFormOpen(false);
              dispatch(fetchOrders());
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder && !formOpen} onClose={() => setSelectedOrder(null)} maxWidth="md">
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Add detailed order view here */}
              <Typography>Order: {selectedOrder.orderNumber}</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OrderList;