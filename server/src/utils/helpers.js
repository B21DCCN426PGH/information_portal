/**
 * Sanitize SQL input to prevent SQL injection
 * Note: This is a basic helper. Always use parameterized queries!
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/['";\\]/g, '');
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

/**
 * Pagination helper
 */
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

/**
 * Build search query
 */
const buildSearchQuery = (searchableFields, searchTerm) => {
  if (!searchTerm || !searchableFields.length) return { sql: '', params: [] };
  
  const conditions = searchableFields.map(() => '?').join(' OR ');
  const params = searchableFields.map(() => `%${searchTerm}%`);
  
  return {
    sql: `WHERE ${searchableFields.map(field => `${field} LIKE ?`).join(' OR ')}`,
    params,
  };
};

/**
 * Success response helper - returns object (for use with res.json())
 */
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return response;
};

/**
 * Error response helper - returns object (for use with res.status().json())
 */
const errorResponse = (message, details = null) => {
  return {
    success: false,
    message,
    details,
  };
};

module.exports = {
  sanitizeInput,
  formatDate,
  paginate,
  buildSearchQuery,
  successResponse,
  errorResponse,
};

