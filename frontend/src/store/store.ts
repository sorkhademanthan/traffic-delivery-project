import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
// import { ordersReducer } from '../features/orders/ordersSlice';
// import driversReducer from '../features/drivers/driversSlice';
// import { routesReducer } from '../features/routes/routesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // orders: ordersReducer,
    // drivers: driversReducer,
    // routes: routesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;