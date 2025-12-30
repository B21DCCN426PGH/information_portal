/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request body:', req.body);
  console.error('Request params:', req.params);

  // Lỗi MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
      details: err.sqlMessage,
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      details: err.sqlMessage,
    });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(400).json({
      success: false,
      message: 'Invalid field name in query.',
      details: err.sqlMessage,
    });
  }

  if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    return res.status(400).json({
      success: false,
      message: 'Invalid value format for field.',
      details: err.sqlMessage,
    });
  }

  if (err.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({
      success: false,
      message: 'Required field is missing.',
      details: err.sqlMessage,
    });
  }

  // Lỗi Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field.',
    });
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired.',
    });
  }

  // Lỗi validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.message,
    });
  }

  // Lỗi mặc định
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const details = process.env.NODE_ENV === 'development' ? err.stack : null;

  res.status(status).json({
    success: false,
    message,
    details,
  });
};

module.exports = errorHandler;


