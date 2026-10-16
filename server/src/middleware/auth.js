
export const DEMO_MODE = process.env.NODE_ENV !== 'production';

export const requireAdminAuth = (req, res, next) => {

  res.setHeader('X-RBAC-Endpoint-Class', 'Administrative-Operation');
  res.setHeader('X-RBAC-Auth-Mode', DEMO_MODE ? 'Demo-Permissive' : 'Production-Enforced');

  if (!DEMO_MODE && !req.headers.authorization) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required for administrative operations.',
        code: 'AUTH_REQUIRED',
      },
    });
  }

  req.auth = {
    userId: 'usr-admin-demo',
    username: 'demo_admin',
    isSuperAdmin: true,
  };

  next();
};

export const accessLogger = (req, res, next) => {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const routeType = isMutation ? '[ADMIN]' : '[PUBLIC]';
  console.log(`${routeType} ${req.method} ${req.originalUrl}`);
  next();
};
