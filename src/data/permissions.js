
import { MOCK_ROLES } from './roles.js';

export const PERMISSION_STORAGE_KEY = 'rbac_matrix_permissions';
export const ROLES_STORAGE_KEY = 'rbac_matrix_roles';

export const PERMISSION_ACTIONS = [
  { id: 'view',    label: 'View',    description: 'Read and inspect module data' },
  { id: 'create',  label: 'Create',  description: 'Add new records or accounts' },
  { id: 'edit',    label: 'Edit',    description: 'Modify existing records' },
  { id: 'delete',  label: 'Delete',  description: 'Remove records or purge data' },
  { id: 'approve', label: 'Approve', description: 'Authorize requests, loans, or payouts' },
  { id: 'export',  label: 'Export',  description: 'Download CSV or PDF reports' },
];

export const MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Operational overview, KPIs, and executive widgets',
    iconName: 'LayoutDashboard',
    applicable: ['view', 'export'],
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer profiles, KYC documentation, and contact records',
    iconName: 'Users',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'membership',
    name: 'Membership',
    description: 'Member enrollment, share capital, and dividend distribution',
    iconName: 'BadgeCheck',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'savings',
    name: 'Savings',
    description: 'Savings accounts, deposits, withdrawals, and interest postings',
    iconName: 'PiggyBank',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'rd',
    name: 'RD',
    fullName: 'Recurring Deposit (RD)',
    description: 'Monthly installment schemes, maturity schedules, and foreclosures',
    iconName: 'CalendarSync',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'loan',
    name: 'Loan',
    description: 'Loan origination, collateral appraisal, disbursals, and EMIs',
    iconName: 'Landmark',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'chitty',
    name: 'Chitty',
    fullName: 'Chitty / Chit Funds',
    description: 'Auction schedules, bid collection, prize releases, and guarantees',
    iconName: 'Coins',
    applicable: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Financial audits, regulatory compliance, and general ledgers',
    iconName: 'FileText',
    applicable: ['view', 'create', 'export'],
  },
];

export const isActionApplicable = (moduleId, actionId) => {
  const mod = MODULES.find((m) => m.id === moduleId);
  return mod ? mod.applicable.includes(actionId) : false;
};

export const DEFAULT_ROLE_PERMISSIONS = {

  'role-001': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    customers:  { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    membership: { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    savings:    { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    rd:         { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    loan:       { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    chitty:     { view: true,  create: true,  edit: true,  delete: true,  approve: true,  export: true  },
    reports:    { view: true,  create: true,  edit: false, delete: false, approve: false, export: true  },
  },

  'role-002': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    customers:  { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    membership: { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    savings:    { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    rd:         { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    loan:       { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    chitty:     { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    reports:    { view: true,  create: true,  edit: false, delete: false, approve: false, export: true  },
  },

  'role-003': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    customers:  { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    membership: { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    savings:    { view: true,  create: true,  edit: true,  delete: false, approve: false, export: false },
    rd:         { view: true,  create: true,  edit: true,  delete: false, approve: false, export: false },
    loan:       { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    chitty:     { view: true,  create: true,  edit: false, delete: false, approve: false, export: false },
    reports:    { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },

  'role-004': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    customers:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    membership: { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    savings:    { view: true,  create: true,  edit: true,  delete: false, approve: false, export: true  },
    rd:         { view: true,  create: true,  edit: true,  delete: false, approve: false, export: true  },
    loan:       { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    chitty:     { view: true,  create: true,  edit: true,  delete: false, approve: false, export: true  },
    reports:    { view: true,  create: true,  edit: false, delete: false, approve: false, export: true  },
  },

  'role-005': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    customers:  { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    membership: { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    savings:    { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    rd:         { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    loan:       { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    chitty:     { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
    reports:    { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
  },

  'role-006': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    customers:  { view: true,  create: true,  edit: true,  delete: false, approve: false, export: true  },
    membership: { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    savings:    { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    rd:         { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    loan:       { view: true,  create: true,  edit: true,  delete: false, approve: true,  export: true  },
    chitty:     { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    reports:    { view: true,  create: false, edit: false, delete: false, approve: false, export: true  },
  },

  'role-007': {
    dashboard:  { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    customers:  { view: true,  create: true,  edit: true,  delete: false, approve: false, export: false },
    membership: { view: true,  create: true,  edit: false, delete: false, approve: false, export: false },
    savings:    { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    rd:         { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    loan:       { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    chitty:     { view: true,  create: false, edit: false, delete: false, approve: false, export: false },
    reports:    { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
};

export const createEmptyRolePermissions = () => {
  const result = {};
  MODULES.forEach((mod) => {
    result[mod.id] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
    };
  });
  return result;
};

export const loadSavedPermissions = () => {
  try {
    const raw = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
  } catch (err) {
    console.error('Error loading permissions from localStorage:', err);
    return DEFAULT_ROLE_PERMISSIONS;
  }
};

export const persistPermissions = (permissions) => {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(permissions));
  } catch (err) {
    console.error('Error saving permissions to localStorage:', err);
  }
};

export const loadStoredRoles = () => {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return MOCK_ROLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_ROLES;
  } catch (err) {
    console.error('Error loading roles from localStorage:', err);
    return MOCK_ROLES;
  }
};

export const persistRoles = (roles) => {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch (err) {
    console.error('Error saving roles to localStorage:', err);
  }
};
