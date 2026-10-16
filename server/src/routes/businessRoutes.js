
import express from 'express';
import { verifyPermission, verifyBranchScope, createTrustedToken } from '../middleware/authorize.js';

const router = express.Router();

router.post('/test-session', (req, res) => {
  const token = createTrustedToken(req.body);
  res.status(200).json({
    success: true,
    token,
  });
});

router.get(
  '/savings',
  verifyPermission('savings', 'view'),
  verifyBranchScope(),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Savings accounts retrieved successfully.',
      module: 'savings',
      action: 'view',
      user: req.user.username,
      role: req.role.name,
      branchScopeFilter: req.branchScopeFilter,
      data: [
        { id: 'sav-001', accountNumber: 'SB-100452', balance: 45000, branch: 'Head Office' },
        { id: 'sav-002', accountNumber: 'SB-100453', balance: 12500, branch: 'Downtown Branch' },
      ],
    });
  }
);

router.post(
  '/savings',
  verifyPermission('savings', 'create'),
  verifyBranchScope(),
  (req, res) => {
    res.status(201).json({
      success: true,
      message: 'New savings account created successfully.',
      module: 'savings',
      action: 'create',
      user: req.user.username,
      role: req.role.name,
      branch: req.body?.branch || req.user.assignedBranch,
    });
  }
);

router.put(
  '/savings/:id',
  verifyPermission('savings', 'edit'),
  verifyBranchScope(),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Savings account ${req.params.id} updated successfully.`,
      module: 'savings',
      action: 'edit',
      user: req.user.username,
      role: req.role.name,
    });
  }
);

router.delete(
  '/savings/:id',
  verifyPermission('savings', 'delete'),
  verifyBranchScope(),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Savings account ${req.params.id} purged successfully.`,
      module: 'savings',
      action: 'delete',
      user: req.user.username,
      role: req.role.name,
    });
  }
);

router.post(
  '/loan/approve',
  verifyPermission('loan', 'approve'),
  verifyBranchScope(),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Loan application approved successfully.',
      module: 'loan',
      action: 'approve',
      user: req.user.username,
      role: req.role.name,
      approvalAuthority: req.role.approvalLevel,
      loanId: req.body?.loanId || 'loan-9901',
    });
  }
);

router.get(
  '/reports/export',
  verifyPermission('reports', 'export'),
  verifyBranchScope(),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Report export generated successfully.',
      module: 'reports',
      action: 'export',
      user: req.user.username,
      role: req.role.name,
      exportedAt: new Date().toISOString(),
    });
  }
);

router.get(
  '/branches/:branchId/data',
  verifyPermission('savings', 'view'),
  verifyBranchScope((req) => req.params.branchId),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Accessed branch "${req.params.branchId}" data successfully.`,
      targetBranch: req.params.branchId,
      user: req.user.username,
      role: req.role.name,
      branchScope: req.role.branchScope,
    });
  }
);

export default router;
