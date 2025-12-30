const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');
const authGuard = require('../middleware/auth');
const superAdminGuard = require('../middleware/superAdminGuard');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
      if (!rows.length) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const admin = rows[0];
      const isMatch = await bcrypt.compare(password, admin.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role || 'admin' },
        process.env.JWT_SECRET || 'fit-secret',
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        profile: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role || 'admin',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Endpoint xác thực token
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing',
      });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'fit-secret');
      const [rows] = await pool.query('SELECT id, name, email, role FROM admins WHERE id = ?', [
        payload.id,
      ]);

      if (!rows.length) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        profile: rows[0],
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/create-admin - Tạo tài khoản admin mới (chỉ super-admin)
router.post(
  '/create-admin',
  authGuard,
  superAdminGuard,
  [
    body('name').notEmpty().withMessage('Tên là bắt buộc'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('role').optional().isIn(['admin', 'super-admin']).withMessage('Role phải là admin hoặc super-admin'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, email, password, role = 'admin' } = req.body;

      // Kiểm tra email đã tồn tại chưa
      const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email đã tồn tại',
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Tạo admin mới
      const [result] = await pool.query(
        'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, password_hash, role]
      );

      // Lấy thông tin admin vừa tạo
      const [[newAdmin]] = await pool.query(
        'SELECT id, name, email, role, created_at FROM admins WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản admin thành công',
        admin: newAdmin,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/admins - Lấy danh sách tất cả admin (chỉ super-admin)
router.get('/admins', authGuard, superAdminGuard, async (req, res, next) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, name, email, role, created_at FROM admins ORDER BY created_at DESC'
    );
    res.json(admins);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/admins/:id - Xóa admin (chỉ super-admin, không được xóa chính mình)
router.delete('/admins/:id', authGuard, superAdminGuard, async (req, res, next) => {
  try {
    const adminId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    // Không cho phép xóa chính mình
    if (adminId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính bạn',
      });
    }

    // Kiểm tra admin có tồn tại không
    const [existing] = await pool.query('SELECT id, role FROM admins WHERE id = ?', [adminId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin',
      });
    }

    // Xóa admin
    await pool.query('DELETE FROM admins WHERE id = ?', [adminId]);

    res.json({
      success: true,
      message: 'Xóa admin thành công',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


