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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { createDriver, updateDriver } from './driversSlice';
import { Driver } from '../../types/api.types';
import toast from 'react-hot-toast';

const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format'),
  vehicleType: z.enum(['BIKE', 'SCOOTER', 'CAR', 'VAN', 'TRUCK']),
  status: z.enum(['AVAILABLE', 'ON_ROUTE', 'OFF_DUTY', 'UNAVAILABLE']),
  isActive: z.boolean(),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface DriverFormProps {
  driver: Driver | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const DriverForm: React.FC<DriverFormProps> = ({ driver, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      vehicleType: 'CAR',
      status: 'AVAILABLE',
      isActive: true,
    },
  });

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        status: driver.status,
        isActive: driver.isActive,
      });
    }
  }, [driver, reset]);

  const onSubmit = async (data: DriverFormData) => {
    setLoading(true);
    try {
      if (driver) {
        const result = await dispatch(updateDriver({ id: driver.id, data }));
        if (updateDriver.fulfilled.match(result)) {
          toast.success('Driver updated successfully');
          onSuccess();
        }
      } else {
        const result = await dispatch(createDriver(data));
        if (createDriver.fulfilled.match(result)) {
          toast.success('Driver created successfully');
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
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number"
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="vehicleType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Vehicle Type"
                fullWidth
                error={!!errors.vehicleType}
                helperText={errors.vehicleType?.message}
              >
                <MenuItem value="BIKE">Bike</MenuItem>
                <MenuItem value="SCOOTER">Scooter</MenuItem>
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="VAN">Van</MenuItem>
                <MenuItem value="TRUCK">Truck</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Status"
                fullWidth
                error={!!errors.status}
                helperText={errors.status?.message}
              >
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="ON_ROUTE">On Route</MenuItem>
                <MenuItem value="OFF_DUTY">Off Duty</MenuItem>
                <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Active Status"
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
          {driver ? 'Update' : 'Create'} Driver
        </Button>
      </Box>
    </Box>
  );
};

export default DriverForm;