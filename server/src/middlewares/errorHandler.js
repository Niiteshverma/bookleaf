/**
 * Centralized Application Error Handling Middleware
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Prisma Unique Constraint Violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    return res.status(409).json({
      success: false,
      message: `A record with this unique value already exists${fields}.`,
    });
  }

  // Prisma Foreign Key Constraint Violation (P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Invalid related entity reference. Foreign key constraint failed.',
    });
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'Requested database record was not found.',
    });
  }

  // JSON Body Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload provided.',
    });
  }

  // Standard status code or default 500
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default {
  notFoundHandler,
  globalErrorHandler,
};
