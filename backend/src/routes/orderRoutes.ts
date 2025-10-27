import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
  bulkCreateOrders,
  uploadOrdersCSV,
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Order CRUD
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

// Bulk operations
router.post('/bulk', bulkCreateOrders);
router.post('/upload-csv', upload.single('file'), uploadOrdersCSV);

export default router;