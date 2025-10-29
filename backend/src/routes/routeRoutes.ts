// filepath: backend/src/routes/routeRoutes.ts
import { Router } from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  assignOrdersToRoute,
  startRoute,
  completeRoute,
  getRouteStats,
} from '../controllers/routeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Route CRUD
router.post('/', createRoute);
router.get('/', getRoutes);
router.get('/stats', getRouteStats);
router.get('/:id', getRouteById);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);

// Route operations
router.post('/:id/assign-orders', assignOrdersToRoute);
router.patch('/:id/start', startRoute);
router.patch('/:id/complete', completeRoute);

export default router;