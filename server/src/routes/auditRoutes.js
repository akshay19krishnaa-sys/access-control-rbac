import express from 'express';
import { getAuditLogs, exportAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

// GET /api/audit-logs
router.get('/', getAuditLogs);

// GET /api/audit-logs/export
router.get('/export', exportAuditLogs);

export default router;
