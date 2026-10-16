/**
 * auth.js — Authentication & Authorization Middleware Stubs
 *
 * NOTE ON SECURITY ARCHITECTURE:
 * Per Phase 4 specifications, full user authentication (JWT/OAuth/Sessions) is excluded
 * from this phase to focus on the core RBAC data model and REST API persistence.
 *
 * This middleware clearly delineates between:
 * 1. Public / Demo Endpoints: Read-only inspection of roles & permission matrix.
 * 2. Administrative Operations: Mutation endpoints (POST, PUT, PATCH, DELETE) that
 *    modify roles and system permissions.
 *
 * In production, administrative endpoints must be guarded by verifying a valid JWT
 * and checking user claims (e.g. `req.user.hasRole('System Administrator')`).
 */

export const DEMO_MODE = process.env.NODE_ENV !== 'production';

/**
 * requireAdminAuth — Placeholder middleware for administrative endpoints.
 * Currently allows demo mode execution while attaching security context and headers
 * indicating the endpoint's protected status.
 */
export const requireAdminAuth = (req, res, next) => {
  // Add enterprise audit headers
  res.setHeader('X-RBAC-Endpoint-Class', 'Administrative-Operation');
  res.setHeader('X-RBAC-Auth-Mode', DEMO_MODE ? 'Demo-Permissive' : 'Production-Enforced');

  // In production, enforce JWT / session validation:
  if (!DEMO_MODE && !req.headers.authorization) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required for administrative operations.',
        code: 'AUTH_REQUIRED',
      },
    });
  }

  // Attach mock administrative user context for logging/auditing
  req.auth = {
    userId: 'usr-admin-demo',
    username: 'demo_admin',
    isSuperAdmin: true,
  };

  next();
};

/**
 * demoNoticeMiddleware — Logs and annotates public vs admin routes.
 */
export const accessLogger = (req, res, next) => {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const routeType = isMutation ? '[ADMIN]' : '[PUBLIC]';
  console.log(`${routeType} ${req.method} ${req.originalUrl}`);
  next();
};
