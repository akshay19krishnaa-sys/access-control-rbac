import { Router } from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  patchRoleStatus,
  cloneRole,
  deleteRole,
} from '../controllers/roleController.js';
import { updateRolePermissions } from '../controllers/permissionController.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getRoles);
router.get('/:id', getRoleById);

router.post('/', requireAdminAuth, createRole);
router.put('/:id', requireAdminAuth, updateRole);
router.patch('/:id/status', requireAdminAuth, patchRoleStatus);
router.post('/:id/clone', requireAdminAuth, cloneRole);
router.put('/:id/permissions', requireAdminAuth, updateRolePermissions);
router.delete('/:id', requireAdminAuth, deleteRole);

export default router;
