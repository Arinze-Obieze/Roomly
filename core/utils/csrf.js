/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for form submissions
 */

import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';

const encoder = new TextEncoder();
let cachedSecret = null;
let loggedMissingSecret = false;

const getCsrfSecret = () => {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    if (!loggedMissingSecret) {
      loggedMissingSecret = true;
      console.error('[CSRF] Missing CSRF_SECRET');
    }
    return null;
  }

  cachedSecret = encoder.encode(secret);
  return cachedSecret;
};

const getRequestFingerprint = (request) => {
  if (!request?.cookies) return 'no-cookies';

  const accessToken = request.cookies.get('sb-access-token')?.value || '';
  const refreshToken = request.cookies.get('sb-refresh-token')?.value || '';

  const source = accessToken || refreshToken
    ? `${accessToken}:${refreshToken}`
    : request.cookies.getAll().map((cookie) => cookie.name).sort().join(':');

  return crypto.createHash('sha256').update(source).digest('hex');
};

/**
 * Generate a CSRF token
 * @returns {Promise<string>} JWT token
 */
export async function generateCSRFToken(request = null) {
  const secret = getCsrfSecret();
  if (!secret) {
    throw new Error('CSRF protection is not configured');
  }

  return new SignJWT({
    timestamp: Date.now(),
    fp: request ? getRequestFingerprint(request) : 'unbound',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Verify CSRF token
 * @param {string} token - The CSRF token to verify
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function verifyCSRFToken(token, request = null) {
  try {
    if (!token) return false;

    const secret = getCsrfSecret();
    if (!secret) return false;

    const verified = await jwtVerify(token, secret);
    const tokenFingerprint = verified?.payload?.fp;

    if (request) {
      return tokenFingerprint === getRequestFingerprint(request);
    }

    return !!verified.payload;
  } catch (error) {
    console.error('[CSRF] Token verification failed');
    return false;
  }
}

/**
 * CSRF middleware for API routes
 * @param {Request} request - Next.js request object
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateCSRFRequest(request) {
  // Only validate POST, PUT, DELETE, PATCH requests
  const method = request.method;
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }; // GET requests don't need CSRF protection
  }

  if (!getCsrfSecret()) {
    return {
      valid: false,
      error: 'CSRF protection is not configured.',
    };
  }

  try {
    // Check for token in header (preferred) or body
    let token = request.headers.get('x-csrf-token');

    if (!token) {
      try {
        const body = await request.clone().json();
        token = body?.csrfToken;
      } catch {
        token = null;
      }
    }

    if (!token) {
      return {
        valid: false,
        error: 'CSRF token missing. Please include x-csrf-token header or csrfToken in request body.',
      };
    }

    const isValid = await verifyCSRFToken(token, request);
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token.',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('[CSRF] Validation failed');
    return {
      valid: false,
      error: 'CSRF validation failed.',
    };
  }
}

/**
 * Helper to create CSRF protected response
 * @returns {Promise<Response>} Form with CSRF token
 */
export async function generateCSRFResponse(request = null) {
  const token = await generateCSRFToken(request);
  return {
    csrfToken: token,
  };
}
