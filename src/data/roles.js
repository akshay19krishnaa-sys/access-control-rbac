
export const BRANCH_SCOPES = [
  { value: 'Assigned Branch',   label: 'Assigned Branch'   },
  { value: 'Selected Branches', label: 'Selected Branches' },
  { value: 'All Branches',      label: 'All Branches'      },
];

export const APPROVAL_LEVELS = [0, 1, 2, 3, 4];

export const AVAILABLE_BRANCHES = [
  'Main Branch',
  'North Branch',
  'South Branch',
  'East Branch',
  'West Branch',
  'Downtown Branch',
  'Airport Branch',
];

export const MOCK_ROLES = [
  {
    id: 'role-001',
    name: 'System Administrator',
    description:
      'Full unrestricted access to all modules, system configuration, user management, audit logs, and compliance reports.',
    usersAssigned: 3,
    branchScope: 'All Branches',
    selectedBranches: [],
    approvalLevel: 4,
    approvalLimit: null,
    status: 'active',
    createdDate: '2024-01-10',
    isSystem: true,
    iconColor: '#176B87',
  },
  {
    id: 'role-002',
    name: 'Branch Manager',
    description:
      'Manages daily operations of assigned branches including staff oversight, transaction approvals, and performance reporting.',
    usersAssigned: 12,
    branchScope: 'Selected Branches',
    selectedBranches: ['Main Branch', 'North Branch', 'South Branch'],
    approvalLevel: 3,
    approvalLimit: 50000,
    status: 'active',
    createdDate: '2024-01-12',
    isSystem: false,
    iconColor: '#0891b2',
  },
  {
    id: 'role-003',
    name: 'Cashier',
    description:
      'Handles customer transactions, cash deposits and withdrawals within assigned branch daily transaction limits.',
    usersAssigned: 45,
    branchScope: 'Assigned Branch',
    selectedBranches: [],
    approvalLevel: 1,
    approvalLimit: 5000,
    status: 'active',
    createdDate: '2024-01-15',
    isSystem: false,
    iconColor: '#d97706',
  },
  {
    id: 'role-004',
    name: 'Accountant',
    description:
      'Manages financial records, reconciliation, and reporting for assigned branches with read access to inter-branch data.',
    usersAssigned: 18,
    branchScope: 'Selected Branches',
    selectedBranches: ['Main Branch', 'East Branch'],
    approvalLevel: 2,
    approvalLimit: 20000,
    status: 'active',
    createdDate: '2024-02-01',
    isSystem: false,
    iconColor: '#059669',
  },
  {
    id: 'role-005',
    name: 'Auditor',
    description:
      'Read-only access to audit logs, transaction history, and compliance reports across all branches. No write permissions.',
    usersAssigned: 4,
    branchScope: 'All Branches',
    selectedBranches: [],
    approvalLevel: 0,
    approvalLimit: null,
    status: 'active',
    createdDate: '2024-02-10',
    isSystem: true,
    iconColor: '#7c3aed',
  },
  {
    id: 'role-006',
    name: 'Loan Officer',
    description:
      'Processes loan applications, performs credit assessments, and manages loan disbursements within defined approval thresholds.',
    usersAssigned: 22,
    branchScope: 'Assigned Branch',
    selectedBranches: [],
    approvalLevel: 2,
    approvalLimit: 100000,
    status: 'active',
    createdDate: '2024-03-05',
    isSystem: false,
    iconColor: '#dc2626',
  },
  {
    id: 'role-007',
    name: 'Customer Service',
    description:
      'Handles customer inquiries, account updates, and basic service requests. No transaction approval authority.',
    usersAssigned: 31,
    branchScope: 'Assigned Branch',
    selectedBranches: [],
    approvalLevel: 0,
    approvalLimit: null,
    status: 'inactive',
    createdDate: '2024-03-20',
    isSystem: false,
    iconColor: '#db2777',
  },
];
