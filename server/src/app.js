import express from 'express';
import cors from 'cors';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import approvalLevelRoutes from './routes/approvalLevelRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { accessLogger } from './middleware/auth.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { connectDB } from './config/db.js';

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://access-control-rbac-7c1w.vercel.app',
];

const envAllowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(accessLogger);

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Access Control RBAC API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      roles: '/api/roles',
      permissions: '/api/permissions',
      approvalLevels: '/api/approval-levels',
      auditLogs: '/api/audit-logs',
      settings: '/api/settings/audit',
      reports: '/api/reports/role-summary',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'access-control-rbac-api',
    version: '1.0.0',
  });
});

app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/approval-levels', approvalLevelRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
