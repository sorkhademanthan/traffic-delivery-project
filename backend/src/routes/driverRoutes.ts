// filepath: backend/src/routes/driverRoutes.ts
import { Router } from 'express';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  getDriverStats,
} from '../controllers/driverController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Driver CRUD
router.post('/', createDriver);
router.get('/', getDrivers);
router.get('/stats', getDriverStats);
router.get('/:id', getDriverById);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

// Status management
router.patch('/:id/status', updateDriverStatus);

export default router;