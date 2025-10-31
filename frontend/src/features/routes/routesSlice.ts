import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { Route } from '../../types/api.types';

interface RoutesState {
  routes: Route[];
  loading: boolean;
  error: string | null;
}

const initialState: RoutesState = {
  routes: [],
  loading: false,
  error: null,
};

export const fetchRoutes = createAsyncThunk(
  'routes/fetchRoutes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ routes: Route[] }>('/routes');
      return response.data.routes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch routes');
    }
  }
);

export const createRoute = createAsyncThunk(
  'routes/createRoute',
  async (routeData: { driverId: string; orderIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ route: Route }>('/routes', routeData);
      return response.data.route;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create route');
    }
  }
);

export const optimizeRoute = createAsyncThunk(
  'routes/optimizeRoute',
  async (routeId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ route: Route }>(`/routes/${routeId}/optimize`);
      return response.data.route;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to optimize route');
    }
  }
);

const routesSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        state.routes.unshift(action.payload);
      })
      .addCase(optimizeRoute.fulfilled, (state, action) => {
        const index = state.routes.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.routes[index] = action.payload;
        }
      });
  },
});

export const { clearError } = routesSlice.actions;
export default routesSlice.reducer;