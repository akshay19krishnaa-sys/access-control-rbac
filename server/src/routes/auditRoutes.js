import express from 'express';
import { getAuditLogs, exportAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.get('/', getAuditLogs);

router.get('/export', exportAuditLogs);

export default router;
