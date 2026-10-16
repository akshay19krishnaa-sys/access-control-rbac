import { Router } from 'express';
import { getPermissions } from '../controllers/permissionController.js';

const router = Router();

// Public / Demo Inspection of Permissions & Matrix
router.get('/', getPermissions);

export default router;
