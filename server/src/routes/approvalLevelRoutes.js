import express from 'express';
import {
  getApprovalLevels,
  createApprovalLevel,
} from '../controllers/approvalLevelController.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getApprovalLevels)
  .post(requireAdminAuth, createApprovalLevel);

export default router;
