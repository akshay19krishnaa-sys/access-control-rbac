
import { Router } from 'express';
import {
  getRoleSummaryReport,
  getPermissionMatrixReport,
  getRoleAssignmentReport,
  getInactiveRolesReport,
  exportReport,
} from '../controllers/reportController.js';
import { verifyPermission } from '../middleware/authorize.js';

const router = Router();

const guardReportView = (req, res, next) => {
  if (req.headers.authorization) {
    return verifyPermission('reports', 'view')(req, res, next);
  }
  next();
};

const guardReportExport = (req, res, next) => {
  if (req.headers.authorization) {
    return verifyPermission('reports', 'export')(req, res, next);
  }
  next();
};

router.get('/role-summary', guardReportView, getRoleSummaryReport);
router.get('/permission-matrix', guardReportView, getPermissionMatrixReport);
router.get('/role-assignment', guardReportView, getRoleAssignmentReport);
router.get('/inactive-roles', guardReportView, getInactiveRolesReport);
router.get('/export', guardReportExport, exportReport);

router.get('/protected-export', verifyPermission('reports', 'export'), exportReport);

export default router;
