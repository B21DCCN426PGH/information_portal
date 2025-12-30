const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const { successResponse, errorResponse } = require('../utils/helpers');
const uploadExcel = require('../middleware/uploadExcel');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Đăng ký sinh viên
router.post(
  '/register',
  authGuard,
  [
    body('student_code').notEmpty().withMessage('Mã sinh viên là bắt buộc'),
    body('name').notEmpty().withMessage('Tên là bắt buộc'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('phone').notEmpty().withMessage('Số điện thoại là bắt buộc'),
    body('major_id').notEmpty().withMessage('Ngành học là bắt buộc'),
    body('class_name').notEmpty().withMessage('Lớp là bắt buộc'),
    body('date_of_birth').notEmpty().withMessage('Ngày sinh là bắt buộc'),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
        return res.status(403).json(errorResponse('Chỉ admin mới có quyền tạo tài khoản sinh viên'));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { student_code, name, email, password, phone, major_id, class_name, date_of_birth, gpa } = req.body;

      // Kiểm tra tồn tại
      const [existing] = await pool.query(
        'SELECT id, student_code, email, phone FROM students WHERE student_code = ? OR email = ? OR phone = ?',
        [student_code, email, phone]
      );

      if (existing.length > 0) {
        const existingStudent = existing[0];
        if (existingStudent.student_code === student_code) {
          return res.status(409).json(errorResponse('Mã sinh viên đã tồn tại'));
        }
        if (existingStudent.email === email) {
          return res.status(409).json(errorResponse('Email đã tồn tại'));
        }
        if (existingStudent.phone === phone) {
          return res.status(409).json(errorResponse('Số điện thoại đã tồn tại'));
        }
      }

      const password_hash = await bcrypt.hash(password, 10);

      // Kiểm tra GPA (0-4.0)
      const gpaValue = gpa !== undefined ? parseFloat(gpa) : 4.0;
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4.0) {
        return res.status(400).json(errorResponse('GPA phải là số từ 0.0 đến 4.0'));
      }

      const [result] = await pool.query(
        'INSERT INTO students (student_code, name, email, password_hash, phone, major_id, class_name, date_of_birth, gpa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [student_code, name, email, password_hash, phone, major_id, class_name, date_of_birth, gpaValue]
      );

      const [newStudent] = await pool.query('SELECT id, student_code, name, email, phone, major_id, class_name, DATE_FORMAT(date_of_birth, "%Y-%m-%d") as date_of_birth, gpa FROM students WHERE id = ?', [
        result.insertId,
      ]);

      res.status(201).json(newStudent[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Đăng nhập sinh viên
router.post(
  '/login',
  [
    body('student_code').notEmpty().withMessage('Mã sinh viên là bắt buộc'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { student_code, password } = req.body;

      const [rows] = await pool.query(
        `SELECT s.*, m.name as major_name 
         FROM students s 
         LEFT JOIN majors m ON s.major_id = m.id 
         WHERE s.student_code = ?`,
        [student_code]
      );
      if (!rows.length) {
        return res.status(401).json(errorResponse('Mã sinh viên hoặc mật khẩu không đúng'));
      }

      const student = rows[0];
      const isMatch = await bcrypt.compare(password, student.password_hash);
      if (!isMatch) {
        return res.status(401).json(errorResponse('Mã sinh viên hoặc mật khẩu không đúng'));
      }

      const token = jwt.sign(
        { id: student.id, email: student.email, role: 'student', student_code: student.student_code },
        process.env.JWT_SECRET || 'fit-secret',
        { expiresIn: '30d' }
      );

      res.json({
        token,
        profile: {
          id: student.id,
          student_code: student.student_code,
          name: student.name,
          email: student.email,
          phone: student.phone,
          major_id: student.major_id,
          major_name: student.major_name,
          class_name: student.class_name,
          gpa: student.gpa,
          date_of_birth: student.date_of_birth,
          role: 'student',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Lấy thông tin cá nhân
router.get('/profile', authGuard, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json(errorResponse('Chỉ sinh viên mới có quyền truy cập'));
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.student_code, s.name, s.email, s.phone, s.major_id, s.class_name, 
       DATE_FORMAT(s.date_of_birth, "%Y-%m-%d") as date_of_birth, s.gpa, 
       m.name as major_name 
       FROM students s 
       LEFT JOIN majors m ON s.major_id = m.id 
       WHERE s.id = ?`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json(errorResponse('Không tìm thấy sinh viên'));
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// Đổi mật khẩu
router.put(
  '/change-password',
  authGuard,
  [
    body('current_password').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    body('confirm_password')
      .custom((value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json(errorResponse('Chỉ sinh viên mới có quyền đổi mật khẩu'));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { current_password, new_password } = req.body;

      // Lấy thông tin sinh viên hiện tại
      const [rows] = await pool.query('SELECT password_hash FROM students WHERE id = ?', [
        req.user.id,
      ]);

      if (!rows.length) {
        return res.status(404).json(errorResponse('Không tìm thấy sinh viên'));
      }

      // Xác thực mật khẩu hiện tại
      const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!isMatch) {
        return res.status(401).json(errorResponse('Mật khẩu hiện tại không đúng'));
      }

      // Mã hóa mật khẩu mới
      const password_hash = await bcrypt.hash(new_password, 10);

      // Cập nhật mật khẩu
      await pool.query('UPDATE students SET password_hash = ? WHERE id = ?', [
        password_hash,
        req.user.id,
      ]);

      res.json(successResponse(null, 'Đổi mật khẩu thành công'));
    } catch (error) {
      next(error);
    }
  }
);

// Quên mật khẩu - Gửi email reset
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { email } = req.body;

      // Tìm sinh viên theo email
      const [rows] = await pool.query('SELECT id, student_code, name, email FROM students WHERE email = ?', [email]);
      
      // Luôn trả về success để không tiết lộ email có tồn tại hay không
      if (!rows.length) {
        return res.json(successResponse(null, 'Nếu email tồn tại, chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn.'));
      }

      const student = rows[0];

      // Tạo token reset password
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token hết hạn sau 1 giờ

      // Lưu token vào database
      await pool.query(
        'INSERT INTO password_reset_tokens (student_id, token, expires_at) VALUES (?, ?, ?)',
        [student.id, resetToken, expiresAt]
      );

      // Gửi email
      try {
        await sendPasswordResetEmail(student.email, resetToken, student.name);
        res.json(successResponse(null, 'Chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.'));
      } catch (emailError) {
        console.error('Error sending reset email:', emailError);
        // Xóa token nếu không gửi được email
        await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [resetToken]);
        return res.status(500).json(errorResponse('Không thể gửi email. Vui lòng thử lại sau.'));
      }
    } catch (error) {
      next(error);
    }
  }
);

// Reset mật khẩu với token
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token là bắt buộc'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('confirm_password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { token, password } = req.body;

      // Tìm token trong database
      const [tokenRows] = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0',
        [token]
      );

      if (!tokenRows.length) {
        return res.status(400).json(errorResponse('Token không hợp lệ hoặc đã được sử dụng.'));
      }

      const resetToken = tokenRows[0];

      // Kiểm tra token đã hết hạn chưa
      if (new Date() > new Date(resetToken.expires_at)) {
        return res.status(400).json(errorResponse('Token đã hết hạn. Vui lòng yêu cầu khôi phục mật khẩu mới.'));
      }

      // Mã hóa mật khẩu mới
      const password_hash = await bcrypt.hash(password, 10);

      // Cập nhật mật khẩu
      await pool.query('UPDATE students SET password_hash = ? WHERE id = ?', [
        password_hash,
        resetToken.student_id,
      ]);

      // Đánh dấu token đã sử dụng
      await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);

      res.json(successResponse(null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.'));
    } catch (error) {
      next(error);
    }
  }
);

// Lấy tất cả sinh viên
router.get('/', authGuard, adminGuard, async (req, res, next) => {
  try {

    const { q, page, limit: limitParam } = req.query;
    const searchableFields = ['student_code', 'name', 'email', 'phone', 'class_name'];
    
    // Định dạng ngày sinh
    let sql = 'SELECT s.id, s.student_code, s.name, s.email, s.phone, s.major_id, s.class_name, DATE_FORMAT(s.date_of_birth, "%Y-%m-%d") as date_of_birth, s.gpa, m.name as major_name FROM students s LEFT JOIN majors m ON s.major_id = m.id';
    const params = [];
    
    // Tìm kiếm
    if (q && searchableFields.length) {
      const searchClause = searchableFields.map((field) => `s.${field} LIKE ?`).join(' OR ');
      sql += ` WHERE ${searchClause}`;
      searchableFields.forEach(() => params.push(`%${q}%`));
    }
    
    // Phân trang
    const limit = limitParam ? parseInt(limitParam) : null;
    const offset = page && limit ? (parseInt(page) - 1) * limit : null;
    
    sql += ' ORDER BY s.student_code ASC';
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset !== null) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    const [rows] = await pool.query(sql, params);
    
    // Tổng số trang
    if (limit) {
      let countSql = 'SELECT COUNT(*) AS total FROM students s';
      const countParams = [];
      if (q && searchableFields.length) {
        const searchClause = searchableFields.map((field) => `s.${field} LIKE ?`).join(' OR ');
        countSql += ` WHERE ${searchClause}`;
        searchableFields.forEach(() => countParams.push(`%${q}%`));
      }
      const [countResult] = await pool.query(countSql, countParams);
      const total = countResult[0].total;
      
      return res.json({
        data: rows,
        pagination: {
          page: parseInt(page) || 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/template - Tải template Excel
router.get('/template', authGuard, adminGuard, async (req, res, next) => {
  try {
    const templateData = [
      {
        'Mã sinh viên': 'B21DCCN001',
        'Họ và tên': 'Nguyễn Văn A',
        'Email': 'nguyenvana@stu.ptit.edu.vn',
        'Số điện thoại': '0912345678',
        'Lớp': 'D21CNPM',
        'Ngành học': 'Khoa học máy tính',
        'Ngày sinh': '12/05/2003',
        'GPA': '3.5',
        'Mật khẩu': 'B21DCCN001'
      },
      {
        'Mã sinh viên': 'B21DCCN002',
        'Họ và tên': 'Trần Thị B',
        'Email': 'tranthib@stu.ptit.edu.vn',
        'Số điện thoại': '0912345679',
        'Lớp': 'D21CNPM',
        'Ngành học': 'Công nghệ thông tin',
        'Ngày sinh': '15/06/2003',
        'GPA': '3.8',
        'Mật khẩu': 'B21DCCN002'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sinh viên');

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 15 }, // Mã sinh viên
      { wch: 25 }, // Họ và tên
      { wch: 30 }, // Email
      { wch: 15 }, // Số điện thoại
      { wch: 12 }, // Lớp
      { wch: 25 }, // Ngành học
      { wch: 12 }, // Ngày sinh
      { wch: 8 },  // GPA
      { wch: 15 }  // Mật khẩu
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_sinh_vien.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json(errorResponse('Lỗi khi tạo template Excel'));
  }
});

// Lấy sinh viên theo ID
router.get('/:id', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT s.*, m.name as major_name FROM students s LEFT JOIN majors m ON s.major_id = m.id WHERE s.id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json(errorResponse('Không tìm thấy sinh viên'));
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// Cập nhật sinh viên
router.put('/:id', authGuard, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json(errorResponse('Chỉ admin mới có quyền cập nhật'));
    }

    const { id } = req.params;
    const { student_code, name, email, phone, major_id, class_name, password, date_of_birth, gpa } = req.body;

    // Kiểm tra tồn tại
    const [existing] = await pool.query('SELECT id FROM students WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json(errorResponse('Không tìm thấy sinh viên'));
    }

    // Kiểm tra student_code, email, phone tồn tại
    if (student_code || email || phone) {
      const [duplicate] = await pool.query(
        'SELECT id, student_code, email, phone FROM students WHERE (student_code = ? OR email = ? OR phone = ?) AND id != ?',
        [student_code || '', email || '', phone || '', id]
      );
      if (duplicate.length > 0) {
        const dup = duplicate[0];
        if (student_code && dup.student_code === student_code) {
          return res.status(409).json(errorResponse('Mã sinh viên đã tồn tại'));
        }
        if (email && dup.email === email) {
          return res.status(409).json(errorResponse('Email đã tồn tại'));  
        }
        if (phone && dup.phone === phone) {
          return res.status(409).json(errorResponse('Số điện thoại đã tồn tại'));
        }
      }
    }

    const updateData = {};
    if (student_code !== undefined) updateData.student_code = student_code;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (major_id !== undefined) updateData.major_id = major_id;
    if (class_name !== undefined) updateData.class_name = class_name;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gpa !== undefined) {
      const gpaValue = parseFloat(gpa);
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4.0) {
        return res.status(400).json(errorResponse('GPA phải là số từ 0.0 đến 4.0'));
      }
      updateData.gpa = gpaValue;
    }
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(errorResponse('Không có dữ liệu để cập nhật'));
    }

    await pool.query('UPDATE students SET ? WHERE id = ?', [updateData, id]);

    const [updated] = await pool.query(
      'SELECT s.*, m.name as major_name FROM students s LEFT JOIN majors m ON s.major_id = m.id WHERE s.id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

// Xóa sinh viên
router.delete('/:id', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra sinh viên tồn tại
    const [existing] = await pool.query('SELECT id FROM students WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json(errorResponse('Không tìm thấy sinh viên'));
    }

    // Bắt đầu transaction
    await pool.query('START TRANSACTION');

    try {
      // Tìm tất cả các đăng ký giảng viên của sinh viên này (chỉ những đăng ký đã được duyệt)
      const [registrations] = await pool.query(
        `SELECT slr.lecturer_period_id, lp.period_id, lp.lecturer_id
         FROM student_lecturer_registrations slr
         INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
         WHERE slr.student_id = ? AND slr.status = 'approved'`,
        [id]
      );

      // Trả lại slot
      for (const reg of registrations) {
        await pool.query(
          `UPDATE lecturer_periods
           SET current_slots = GREATEST(0, current_slots - 1)
           WHERE id = ?`,
          [reg.lecturer_period_id]
        );
      }

      // Tìm tất cả các nguyện vọng doanh nghiệp đã được duyệt của sinh viên này
      // Lấy cả period_id và period_enterprise_id để đảm bảo tính độc lập theo từng đợt
      const [preferences] = await pool.query(
        `SELECT period_enterprise_id, period_id 
         FROM student_enterprise_preferences 
         WHERE student_id = ? AND status = 'approved'`,
        [id]
      );

      // Trả lại slot cho các doanh nghiệp trong từng đợt 
      for (const pref of preferences) {
        await pool.query(
          `UPDATE period_enterprises
           SET current_slots = GREATEST(0, current_slots - 1)
           WHERE id = ?`,
          [pref.period_enterprise_id]
        );
      }

      // Xóa sinh viên
      await pool.query('DELETE FROM students WHERE id = ?', [id]);

      await pool.query('COMMIT');
      res.status(204).send();
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Xóa nhiều sinh viên
router.post('/bulk-delete', authGuard, adminGuard, async (req, res, next) => {
  try {
    console.log('Bulk delete request body:', req.body); // Log debug
    const { ids } = req.body;

    if (!ids) {
      return res.status(400).json(errorResponse('Thiếu danh sách ID'));
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('Danh sách ID không hợp lệ hoặc rỗng'));
    }

    // Kiểm tra tất cả ID là số
    const validIds = ids.filter(id => Number.isInteger(Number(id))).map(id => Number(id));
    if (validIds.length === 0) {
      return res.status(400).json(errorResponse('Không có ID hợp lệ'));
    }

    // Kiểm tra tất cả sinh viên tồn tại
    const placeholders = validIds.map(() => '?').join(',');
    const [existing] = await pool.query(
      `SELECT id FROM students WHERE id IN (${placeholders})`,
      validIds
    );

    if (existing.length !== validIds.length) {
      return res.status(404).json(errorResponse('Một số sinh viên không tồn tại'));
    }

    // Bắt đầu transaction
    await pool.query('START TRANSACTION');

    try {
      // Tìm tất cả các đăng ký giảng viên của các sinh viên này (chỉ những đăng ký đã được duyệt)
      const [registrations] = await pool.query(
        `SELECT slr.lecturer_period_id
         FROM student_lecturer_registrations slr
         WHERE slr.student_id IN (${placeholders}) AND slr.status = 'approved'`,
        validIds
      );

      // Trả lại slot cho các giảng viên (nhóm theo lecturer_period_id để tránh trùng lặp)
      const slotMap = new Map();
      for (const reg of registrations) {
        const key = reg.lecturer_period_id;
        slotMap.set(key, (slotMap.get(key) || 0) + 1);
      }

      // Cập nhật slot cho từng giảng viên
      for (const [lecturer_period_id, count] of slotMap.entries()) {
        await pool.query(
          `UPDATE lecturer_periods
           SET current_slots = GREATEST(0, current_slots - ?)
           WHERE id = ?`,
          [count, lecturer_period_id]
        );
      }

      // Tìm tất cả các nguyện vọng doanh nghiệp đã được duyệt của các sinh viên này
      // Lấy period_enterprise_id để trả lại slot
      const [preferences] = await pool.query(
        `SELECT period_enterprise_id
         FROM student_enterprise_preferences 
         WHERE student_id IN (${placeholders}) AND status = 'approved'`,
        validIds
      );

      // Trả lại slot cho các doanh nghiệp (nhóm theo period_enterprise_id để tránh trùng lặp)
      const enterpriseSlotMap = new Map();
      for (const pref of preferences) {
        const key = pref.period_enterprise_id;
        enterpriseSlotMap.set(key, (enterpriseSlotMap.get(key) || 0) + 1);
      }

      // Cập nhật slot cho từng doanh nghiệp
      for (const [period_enterprise_id, count] of enterpriseSlotMap.entries()) {
        await pool.query(
          `UPDATE period_enterprises
           SET current_slots = GREATEST(0, current_slots - ?)
           WHERE id = ?`,
          [count, period_enterprise_id]
        );
      }

      // Xóa tất cả sinh viên
      await pool.query(
        `DELETE FROM students WHERE id IN (${placeholders})`,
        validIds
      );

      await pool.query('COMMIT');
      res.json(successResponse(null, `Đã xóa ${validIds.length} sinh viên thành công`));
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Import sinh viên từ Excel
router.post('/import-excel', authGuard, adminGuard, uploadExcel.single('file'), async (req, res, next) => {
  let filePath = null;
  
  try {
    // Chỉ admin mới có quyền import sinh viên
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json(errorResponse('Chỉ admin mới có quyền import sinh viên'));
    }

    if (!req.file) {
      return res.status(400).json(errorResponse('Vui lòng chọn file Excel'));
    }

    filePath = req.file.path;

    // Đọc file Excel
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    if (data.length === 0) {
      return res.status(400).json(errorResponse('File Excel không có dữ liệu'));
    }

    // Các cột mong đợi: Mã sinh viên, Họ và tên, Email, Số điện thoại, Lớp, Ngành học, Ngày sinh, GPA, Mật khẩu
    const columnMap = {
      'mã sinh viên': 'student_code',
      'mã sv': 'student_code',
      'student_code': 'student_code',
      'họ và tên': 'name',
      'tên': 'name',
      'name': 'name',
      'email': 'email',
      'số điện thoại': 'phone',
      'điện thoại': 'phone',
      'phone': 'phone',
      'lớp': 'class_name',
      'class_name': 'class_name',
      'ngành học': 'major_name',
      'ngành': 'major_name',
      'major_name': 'major_name',
      'ngày sinh': 'date_of_birth',
      'date_of_birth': 'date_of_birth',
      'gpa': 'gpa',
      'điểm': 'gpa',
      'điểm trung bình': 'gpa',
      'mật khẩu': 'password',
      'password': 'password',
    };

    // Chuẩn hóa tên cột
    const normalizedData = data.map((row) => {
      const normalized = {};
      Object.keys(row).forEach((key) => {
        const lowerKey = key.toLowerCase().trim();
        const mappedKey = columnMap[lowerKey];
        if (mappedKey) {
          normalized[mappedKey] = row[key];
        }
      });
      return normalized;
    });

    const [majors] = await pool.query('SELECT id, name FROM majors');
    const majorMap = {};
    majors.forEach((major) => {
      majorMap[major.name.toLowerCase().trim()] = major.id;
    });

    const results = {
      success: [],
      errors: [],
      total: normalizedData.length,
      successCount: 0,
      errorCount: 0,
    };

    // Kiểm tra trùng lặp trong file Excel
    const seenInFile = {
      student_codes: new Set(),
      emails: new Set(),
      phones: new Set(),
    };

    // Xử lý từng dòng
    for (let i = 0; i < normalizedData.length; i++) {
      const row = normalizedData[i];
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Kiểm tra các trường bắt buộc
        if (!row.student_code) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code || '',
            error: 'Thiếu mã sinh viên',
          });
          results.errorCount++;
          continue;
        }

        if (!row.name) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu họ và tên',
          });
          results.errorCount++;
          continue;
        }

        if (!row.email) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu email',
          });
          results.errorCount++;
          continue;
        }

        if (!row.phone) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu số điện thoại',
          });
          results.errorCount++;
          continue;
        }

        if (!row.class_name) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu lớp',
          });
          results.errorCount++;
          continue;
        }

        if (!row.major_name) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu ngành học',
          });
          results.errorCount++;
          continue;
        }

        if (!row.date_of_birth) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: 'Thiếu ngày sinh',
          });
          results.errorCount++;
          continue;
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(row.email).trim())) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Email không hợp lệ: ${row.email}`,
          });
          results.errorCount++;
          continue;
        }

        // Kiểm tra định dạng số điện thoại
        const phoneRegex = /^(\+84|0)[1-9][0-9]{8,9}$/;
        let phoneStr = String(row.phone).trim().replace(/\s+/g, '');
        if (!phoneRegex.test(phoneStr)) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Số điện thoại không hợp lệ: ${row.phone} (Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx)`,
          });
          results.errorCount++;
          continue;
        }
        // Chuẩn hóa số điện thoại: chuyển +84 sang 0
        if (phoneStr.startsWith('+84')) {
          phoneStr = '0' + phoneStr.substring(3);
        }

        // Kiểm tra định dạng mã sinh viên
        const studentCodeStr = String(row.student_code).trim();
        if (studentCodeStr.length < 6 || studentCodeStr.length > 20) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Mã sinh viên phải có từ 6-20 ký tự: ${row.student_code}`,
          });
          results.errorCount++;
          continue;
        }
        if (!/^[A-Za-z0-9]+$/.test(studentCodeStr)) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Mã sinh viên chỉ được chứa chữ cái và số: ${row.student_code}`,
          });
          results.errorCount++;
          continue;
        }

        // Kiểm tra trùng lặp trong file Excel
        const emailStr = String(row.email).trim().toLowerCase();
        if (seenInFile.student_codes.has(studentCodeStr)) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Mã sinh viên trùng lặp trong file Excel: ${row.student_code}`,
          });
          results.errorCount++;
          continue;
        }
        if (seenInFile.emails.has(emailStr)) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Email trùng lặp trong file Excel: ${row.email}`,
          });
          results.errorCount++;
          continue;
        }
        if (seenInFile.phones.has(phoneStr)) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Số điện thoại trùng lặp trong file Excel: ${row.phone}`,
          });
          results.errorCount++;
          continue;
        }

        // Đánh dấu
        seenInFile.student_codes.add(studentCodeStr);
        seenInFile.emails.add(emailStr);
        seenInFile.phones.add(phoneStr);

        // Tìm major_id
        const majorName = String(row.major_name).toLowerCase().trim();
        const major_id = majorMap[majorName];
        if (!major_id) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Không tìm thấy ngành học: ${row.major_name}`,
          });
          results.errorCount++;
          continue;
        }

        // Định dạng ngày sinh
        let date_of_birth = row.date_of_birth;
        const dateStr = String(date_of_birth).trim();
        
        const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (ddmmyyyyMatch) {
          const day = parseInt(ddmmyyyyMatch[1], 10);
          const month = parseInt(ddmmyyyyMatch[2], 10);
          const year = parseInt(ddmmyyyyMatch[3], 10);
          
          // Kiểm tra các thành phần ngày
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            results.errors.push({
              row: rowNum,
              student_code: row.student_code,
              error: `Ngày sinh không hợp lệ: ${row.date_of_birth}`,
            });
            results.errorCount++;
            continue;
          }
          
          // Định dạng thành YYYY-MM-DD
          date_of_birth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        } else if (typeof date_of_birth === 'number') {
          let serial = date_of_birth;
          if (serial >= 61) {
            // Sửa lỗi năm nhuận 1900 của Excel
            serial = serial - 1;
          }
          
          // Chuyển đổi số serial sang ngày
          // Serial 1 = 1900-01-01, nên ta cộng (serial - 1) ngày vào 1900-01-01
          // Sử dụng Date.UTC để tránh vấn đề múi giờ, sau đó chuyển đổi sang các thành phần ngày địa phương
          const baseDate = new Date(Date.UTC(1900, 0, 1)); // 1900-01-01 UTC
          const targetDate = new Date(baseDate.getTime() + (serial - 1) * 86400000);
          
          // Trích xuất các thành phần ngày bằng phương thức UTC để tránh lệch múi giờ
          // Nhưng sau đó ta cần xem xét: ngày Excel được lưu dưới dạng ngày địa phương
          // Vì vậy ta sẽ sử dụng phương pháp kết hợp: tính toán ngày trong UTC, sau đó trích xuất
          const year = targetDate.getUTCFullYear();
          const month = targetDate.getUTCMonth() + 1;
          const day = targetDate.getUTCDate();
          
          date_of_birth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        } else if (date_of_birth instanceof Date) {
          // Khi ngày Excel đã là đối tượng Date, sử dụng phương thức ngày địa phương
          // vì ngày Excel được lưu dưới dạng ngày địa phương, không phải UTC
          const year = date_of_birth.getFullYear();
          const month = String(date_of_birth.getMonth() + 1).padStart(2, '0');
          const day = String(date_of_birth.getDate()).padStart(2, '0');
          date_of_birth = `${year}-${month}-${day}`;
        } else {
          // Thử phân tích ngày chuẩn (cho các định dạng khác như YYYY-MM-DD)
          const parsed = new Date(dateStr);
          
          if (isNaN(parsed.getTime())) {
            results.errors.push({
              row: rowNum,
              student_code: row.student_code,
              error: `Ngày sinh không hợp lệ: ${row.date_of_birth}`,
            });
            results.errorCount++;
            continue;
          }
          
          // Sử dụng phương thức ngày địa phương để đảm bảo tính nhất quán
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          date_of_birth = `${year}-${month}-${day}`;
        }

        // Kiểm tra ngày sinh hợp lý (không ở tương lai, không quá cũ)
        const birthDate = new Date(date_of_birth);
        const today = new Date();
        const minDate = new Date(1950, 0, 1); // Không cũ hơn 1950
        const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()); // Ít nhất 15 tuổi

        if (birthDate > today) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Ngày sinh không thể ở tương lai: ${date_of_birth}`,
          });
          results.errorCount++;
          continue;
        }

        if (birthDate < minDate) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Ngày sinh không hợp lệ (quá cũ): ${date_of_birth}`,
          });
          results.errorCount++;
          continue;
        }

        if (birthDate > maxDate) {
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: `Ngày sinh không hợp lệ (sinh viên phải ít nhất 15 tuổi): ${date_of_birth}`,
          });
          results.errorCount++;
          continue;
        }

        // Kiểm tra và xử lý GPA
        let gpa = 4.0; // Default value
        if (row.gpa !== undefined && row.gpa !== null && row.gpa !== '') {
          const gpaValue = parseFloat(row.gpa);
          if (isNaN(gpaValue)) {
            results.errors.push({
              row: rowNum,
              student_code: row.student_code,
              error: `GPA không hợp lệ: ${row.gpa} (phải là số)`,
            });
            results.errorCount++;
            continue;
          }
          if (gpaValue < 0 || gpaValue > 4.0) {
            results.errors.push({
              row: rowNum,
              student_code: row.student_code,
              error: `GPA không hợp lệ: ${row.gpa} (phải từ 0.0 đến 4.0)`,
            });
            results.errorCount++;
            continue;
          }
          gpa = gpaValue;
        }

        // Tạo mật khẩu nếu không được cung cấp
        let password = row.password || row.student_code; // Mặc định là student_code nếu không được cung cấp

        // Kiểm tra sinh viên đã tồn tại trong cơ sở dữ liệu
        const [existing] = await pool.query(
          'SELECT id, student_code, email, phone FROM students WHERE student_code = ? OR email = ? OR phone = ?',
          [studentCodeStr, emailStr, phoneStr]
        );

        if (existing.length > 0) {
          const existingStudent = existing[0];
          let errorMsg = '';
          if (existingStudent.student_code === studentCodeStr) {
            errorMsg = 'Mã sinh viên đã tồn tại trong hệ thống';
          } else if (existingStudent.email === emailStr) {
            errorMsg = 'Email đã tồn tại trong hệ thống';
          } else if (existingStudent.phone === phoneStr) {
            errorMsg = 'Số điện thoại đã tồn tại trong hệ thống';
          } else {
            errorMsg = 'Thông tin đã tồn tại trong hệ thống';
          }
          results.errors.push({
            row: rowNum,
            student_code: row.student_code,
            error: errorMsg,
          });
          results.errorCount++;
          continue;
        }

        // Mã hóa mật khẩu
        const password_hash = await bcrypt.hash(String(password), 10);

        // Thêm sinh viên
        await pool.query(
          'INSERT INTO students (student_code, name, email, password_hash, phone, major_id, class_name, date_of_birth, gpa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            String(row.student_code).trim(),
            String(row.name).trim(),
            String(row.email).trim(),
            password_hash,
            phoneStr, // Sử dụng số điện thoại đã chuẩn hóa
            major_id,
            String(row.class_name).trim(),
            date_of_birth,
            gpa,
          ]
        );

        results.success.push({
          row: rowNum,
          student_code: row.student_code,
          name: row.name,
        });
        results.successCount++;
      } catch (error) {
        results.errors.push({
          row: rowNum,
          student_code: row.student_code || '',
          error: error.message || 'Lỗi không xác định',
        });
        results.errorCount++;
      }
    }

    // Dọn dẹp file đã tải lên
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Import hoàn tất: ${results.successCount} thành công, ${results.errorCount} lỗi`,
      data: results,
    });
  } catch (error) {
    // Dọn dẹp file đã tải lên khi có lỗi
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    next(error);
  }
});

module.exports = router;

