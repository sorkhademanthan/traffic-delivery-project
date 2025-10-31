// filepath: frontend/src/features/drivers/driversSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { Driver } from '../../types/api.types';

interface DriversState {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}

const initialState: DriversState = {
  drivers: [],
  loading: false,
  error: null,
};

export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ drivers: Driver[] }>('/drivers');
      return response.data.drivers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch drivers');
    }
  }
);

export const createDriver = createAsyncThunk(
  'drivers/createDriver',
  async (driverData: Partial<Driver>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ driver: Driver }>('/drivers', driverData);
      return response.data.driver;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create driver');
    }
  }
);

export const updateDriver = createAsyncThunk(
  'drivers/updateDriver',
  async ({ id, data }: { id: string; data: Partial<Driver> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<{ driver: Driver }>(`/drivers/${id}`, data);
      return response.data.driver;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update driver');
    }
  }
);

export const deleteDriver = createAsyncThunk(
  'drivers/deleteDriver',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/drivers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete driver');
    }
  }
);

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateDriverStatus: (state, action: PayloadAction<{ id: string; status: Driver['status'] }>) => {
      const driver = state.drivers.find(d => d.id === action.payload.id);
      if (driver) {
        driver.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.drivers.unshift(action.payload);
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        const index = state.drivers.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.drivers[index] = action.payload;
        }
      })
      .addCase(deleteDriver.fulfilled, (state, action) => {
        state.drivers = state.drivers.filter(d => d.id !== action.payload);
      });
  },
});

export const { clearError, updateDriverStatus } = driversSlice.actions;
export default driversSlice.reducer;