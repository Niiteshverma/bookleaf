import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

/**
 * Middleware to authenticate requests via Bearer JWT token
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    // Attach decoded user info to the request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory
 * @param {string|string[]} roles - Single role or array of allowed roles (e.g. 'ADMIN', ['AUTHOR'])
 */
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const allowedRoles = roles.flat();
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role(s).`,
      });
    }

    next();
  };
}

export const requireAdmin = authorizeRoles('ADMIN');
export const requireAuthor = authorizeRoles('AUTHOR');

export default {
  authenticate,
  authorizeRoles,
  requireAdmin,
  requireAuthor,
};
