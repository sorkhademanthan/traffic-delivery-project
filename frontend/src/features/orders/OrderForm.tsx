import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { createOrder, updateOrder } from './ordersSlice';
import { Order } from '../../types/api.types';
import toast from 'react-hot-toast';

const orderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(5, 'Valid postal code required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  orderValue: z.number().positive().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  order: Order | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      address: '',
      city: '',
      postalCode: '',
      priority: 'NORMAL',
      orderValue: undefined,
    },
  });

  useEffect(() => {
    if (order) {
      reset({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail || '',
        address: order.address,
        city: order.city,
        postalCode: order.postalCode,
        priority: order.priority,
        orderValue: order.orderValue,
      });
    }
  }, [order, reset]);

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    try {
      if (order) {
        const result = await dispatch(updateOrder({ id: order.id, data }));
        if (updateOrder.fulfilled.match(result)) {
          toast.success('Order updated successfully');
          onSuccess();
        }
      } else {
        const result = await dispatch(createOrder(data));
        if (createOrder.fulfilled.match(result)) {
          toast.success('Order created successfully');
          onSuccess();
        }
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Customer Name"
                fullWidth
                error={!!errors.customerName}
                helperText={errors.customerName?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number"
                fullWidth
                error={!!errors.customerPhone}
                helperText={errors.customerPhone?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email (Optional)"
                fullWidth
                error={!!errors.customerEmail}
                helperText={errors.customerEmail?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Delivery Address"
                fullWidth
                multiline
                rows={2}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="City"
                fullWidth
                error={!!errors.city}
                helperText={errors.city?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Postal Code"
                fullWidth
                error={!!errors.postalCode}
                helperText={errors.postalCode?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Priority"
                fullWidth
                error={!!errors.priority}
                helperText={errors.priority?.message}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="orderValue"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                label="Order Value (Optional)"
                type="number"
                fullWidth
                value={value || ''}
                onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                error={!!errors.orderValue}
                helperText={errors.orderValue?.message}
                InputProps={{ startAdornment: '$' }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {order ? 'Update' : 'Create'} Order
        </Button>
      </Box>
    </Box>
  );
};

export default OrderForm;