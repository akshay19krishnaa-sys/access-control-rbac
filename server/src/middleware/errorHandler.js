
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
};

export const globalErrorHandler = (err, req, res, _next) => {
  console.error('[Error Handler]', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(409).json({
      success: false,
      error: {
        message: `A role with the name "${value}" already exists. Role names must be unique.`,
        code: 'DUPLICATE_KEY_ERROR',
        details: [{ field, value }],
      },
    });
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed for the submitted role data.',
        code: 'VALIDATION_ERROR',
        details,
      },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid ID format: "${err.value}"`,
        code: 'INVALID_ID_FORMAT',
      },
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'An unexpected internal server error occurred.',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      details: err.details || null,
    },
  });
};
