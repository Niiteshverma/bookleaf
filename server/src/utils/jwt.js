import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined in production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'bookleaf_super_secret_jwt_key_2026_xyz';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a new JWT token for an authenticated user
 * @param {Object} payload - { id, email, role, name, authorCode }
 * @returns {string} Signed JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode an incoming JWT token
 * @param {string} token - Bearer JWT token
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export default {
  generateToken,
  verifyToken,
};
