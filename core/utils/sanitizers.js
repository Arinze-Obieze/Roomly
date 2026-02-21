/**
 * Input Sanitization Utility
 * Provides functions to sanitize user inputs to prevent XSS and injection attacks
 */

/**
 * Remove HTML tags and potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Decode HTML entities that might be used for XSS
    .trim();
};

/**
 * Sanitize HTML while preserving basic formatting
 * Only allows specific safe tags
 * @param {string} input - The input HTML string
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';

  // List of allowed tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'a', 'ul', 'ol', 'li'];
  
  // Create a temporary DOM element
  const temp = document.createElement('div');
  temp.innerHTML = input;

  // Recursively remove non-whitelisted tags
  const sanitize = (node) => {
    const nodesToRemove = [];
    
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === 1) { // Element node
        if (!allowedTags.includes(child.tagName.toLowerCase())) {
          // Not in whitelist - move children to parent and remove this node
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          nodesToRemove.push(child);
        } else {
          // Allowed tag - sanitize its attributes
          // Remove potentially dangerous attributes
          const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
          dangerousAttrs.forEach(attr => {
            child.removeAttribute(attr);
          });
          
          // For anchor tags, validate href
          if (child.tagName.toLowerCase() === 'a') {
            const href = child.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('/')) {
              child.removeAttribute('href');
            }
          }
          
          sanitize(child);
        }
      }
    }
    
    nodesToRemove.forEach(node => node.remove());
  };

  sanitize(temp);
  return temp.innerHTML;
};

/**
 * Sanitize email input
 * @param {string} email - The email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
};

/**
 * Sanitize URL
 * @param {string} url - The URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
};

/**
 * Sanitize numeric input
 * @param {any} input - The input to sanitize
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} Sanitized number or null if invalid
 */
export const sanitizeNumber = (input, min = null, max = null) => {
  const num = Number(input);
  
  if (isNaN(num)) return null;
  
  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;
  
  return num;
};

/**
 * Sanitize string length
 * @param {string} input - The input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Truncated string
 */
export const sanitizeLength = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength);
};

/**
 * Batch sanitization for common form patterns
 * @param {object} data - Object with input fields
 * @param {object} schema - Schema defining validation rules
 * @returns {object|null} Sanitized data or null if validation fails
 */
export const sanitizeFormData = (data, schema) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (!schema[key]) continue; // Ignore unknown fields
    
    const { type, maxLength, required } = schema[key];
    
    if (required && !value) {
      return null; // Validation failed
    }
    
    if (!value) {
      sanitized[key] = '';
      continue;
    }

    switch (type) {
      case 'text':
        sanitized[key] = sanitizeText(value);
        if (maxLength) {
          sanitized[key] = sanitizeLength(sanitized[key], maxLength);
        }
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(value);
        break;
      case 'number':
        sanitized[key] = sanitizeNumber(value);
        break;
      default:
        sanitized[key] = String(value);
    }
  }
  
  return sanitized;
};
