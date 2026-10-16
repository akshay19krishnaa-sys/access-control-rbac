import express from 'express';
import { getAuditSettings, updateAuditSettings } from '../controllers/auditController.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/audit', getAuditSettings);

router.put('/audit', requireAdminAuth, updateAuditSettings);

export default router;
