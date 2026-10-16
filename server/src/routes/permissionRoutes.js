import { Router } from 'express';
import { getPermissions } from '../controllers/permissionController.js';

const router = Router();

router.get('/', getPermissions);

export default router;
