/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for form submissions
 */

import { jwtVerify, SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.CSRF_SECRET || 'your-csrf-secret-key');

/**
 * Generate a CSRF token
 * @returns {Promise<string>} JWT token
 */
export async function generateCSRFToken() {
  return new SignJWT({
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

/**
 * Verify CSRF token
 * @param {string} token - The CSRF token to verify
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function verifyCSRFToken(token) {
  try {
    if (!token) return false;
    
    const verified = await jwtVerify(token, SECRET);
    return !!verified.payload;
  } catch (error) {
    console.error('CSRF token verification failed:', error.message);
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

  try {
    // Check for token in header (preferred) or body
    let token = request.headers.get('x-csrf-token');

    if (!token) {
      const body = await request.clone().json();
      token = body.csrfToken;
    }

    if (!token) {
      return {
        valid: false,
        error: 'CSRF token missing. Please include x-csrf-token header or csrfToken in request body.',
      };
    }

    const isValid = await verifyCSRFToken(token);
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token.',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('CSRF validation error:', error);
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
export async function generateCSRFResponse() {
  const token = await generateCSRFToken();
  return {
    csrfToken: token,
  };
}
