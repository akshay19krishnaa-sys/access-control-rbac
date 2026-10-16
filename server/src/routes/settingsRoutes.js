import express from 'express';
import { getAuditSettings, updateAuditSettings } from '../controllers/auditController.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/audit
router.get('/audit', getAuditSettings);

// PUT /api/settings/audit
router.put('/audit', requireAdminAuth, updateAuditSettings);

export default router;
