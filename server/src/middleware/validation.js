const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Các quy tắc validation chung
const commonRules = {
  email: body('email').optional().isEmail().withMessage('Invalid email format'),
  url: (field) => body(field).optional().isURL().withMessage(`Invalid ${field} URL format`),
  requiredString: (field, min = 1, max = 255) =>
    body(field)
      .trim()
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`),
  optionalString: (field, max = 255) =>
    body(field).optional().trim().isLength({ max }).withMessage(`${field} must not exceed ${max} characters`),
  number: (field, min = null, max = null) => {
    let rule = body(field).optional().isInt().withMessage(`${field} must be a number`);
    if (min !== null) rule = rule.isInt({ min }).withMessage(`${field} must be at least ${min}`);
    if (max !== null) rule = rule.isInt({ max }).withMessage(`${field} must not exceed ${max}`);
    return rule;
  },
  date: (field) => body(field).optional().isISO8601().withMessage(`Invalid ${field} date format`),
  dateNotFuture: (field) => 
    body(field)
      .optional()
      .isISO8601()
      .withMessage(`Invalid ${field} date format`)
      .custom((value) => {
        if (value) {
          const inputDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // Set to end of today
          if (inputDate > today) {
            throw new Error(`${field} không được là ngày trong tương lai`);
          }
        }
        return true;
      }),
};

// Quy tắc validate cho các resource cụ thể
const validationRules = {
  banner: [
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('subtitle', 200),
    commonRules.url('image_url'),
    commonRules.optionalString('cta_label', 50),
    commonRules.url('cta_link'),
    commonRules.number('priority', 0, 100),
    handleValidationErrors,
  ],
  news: [
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('summary', 500),
    commonRules.requiredString('content', 1),
    commonRules.url('image_url'),
    commonRules.date('published_at'),
    handleValidationErrors,
  ],
  event: [
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('description'),
    commonRules.date('event_date'),
    commonRules.optionalString('location', 200),
    commonRules.url('cover_image'),
    handleValidationErrors,
  ],
  recruitment: [
    commonRules.requiredString('company_name', 1, 200),
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('position', 200),
    commonRules.optionalString('job_description'),
    commonRules.email,
    commonRules.url('apply_link'),
    commonRules.date('deadline'),
    handleValidationErrors,
  ],
  enterprise: [
    commonRules.requiredString('name', 1, 200),
    commonRules.optionalString('industry', 120),
    commonRules.requiredString('description', 1),
    commonRules.url('logo_url'),
    commonRules.requiredString('address', 1, 255),
    commonRules.url('website'),
    commonRules.dateNotFuture('partnership_date'),
    handleValidationErrors,
  ],
  lecturer: [
    commonRules.requiredString('name', 1, 200),
    commonRules.email,
    commonRules.optionalString('phone', 20),
    commonRules.optionalString('specialization', 200),
    commonRules.optionalString('academic_degree', 100),
    commonRules.optionalString('academic_rank', 100),
    handleValidationErrors,
  ],
  research: [
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('research_period', 50),
    commonRules.date('publication_date'),
    commonRules.optionalString('lead_lecturer', 200),
    commonRules.optionalString('co_authors'),
    commonRules.optionalString('abstract'),
    handleValidationErrors,
  ],
  document: [
    commonRules.requiredString('title', 1, 200),
    commonRules.optionalString('category', 100),
    commonRules.url('file_url'),
    commonRules.optionalString('description'),
    handleValidationErrors,
  ],
  admission: [
    commonRules.optionalString('title', 200),
    commonRules.number('admission_year', 2000, 2100),
    commonRules.optionalString('description'),
    commonRules.optionalString('timeline'),
    commonRules.number('quota', 0),
    commonRules.optionalString('contact_point', 200),
    handleValidationErrors,
  ],
  major: [
    commonRules.requiredString('name', 1, 200),
    commonRules.optionalString('description'),
    commonRules.number('duration_years', 1, 10),
    commonRules.number('sort_order', 0),
    handleValidationErrors,
  ],
  course: [
    commonRules.requiredString('name', 1, 200),
    commonRules.requiredString('code', 1, 50),
    commonRules.optionalString('category', 120),
    commonRules.number('semester', 1, 16),
    commonRules.number('credits', 1, 10),
    commonRules.optionalString('description'),
    handleValidationErrors,
  ],
};

module.exports = {
  validationRules,
  handleValidationErrors,
  commonRules,
};

