const express = require('express');
const pool = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const { successResponse, errorResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Lấy tất cả bộ môn
router.get('/', async (req, res, next) => {
  try {
    const [departments] = await pool.query(
      'SELECT * FROM departments ORDER BY name'
    );

    // Lấy giảng viên cho từng bộ môn
    for (const dept of departments) {
      const [lecturers] = await pool.query(
        `SELECT l.* 
         FROM lecturers l
         WHERE l.department_id = ?
         ORDER BY l.name`,
        [dept.id]
      );
      dept.lecturers = lecturers;
    }

    res.json(departments);
  } catch (error) {
    next(error);
  }
});

// Lấy bộ môn theo ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [departments] = await pool.query(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (!departments.length) {
      return res.status(404).json(errorResponse('Không tìm thấy bộ môn'));
    }

    const department = departments[0];

    // Lấy giảng viên
    const [lecturers] = await pool.query(
      `SELECT l.* 
       FROM lecturers l
       WHERE l.department_id = ?
       ORDER BY l.name`,
      [id]
    );
    department.lecturers = lecturers;

    res.json(department);
  } catch (error) {
    next(error);
  }
});

// Tạo bộ môn (chỉ admin)
router.post(
  '/',
  authGuard,
  adminGuard,
  [
    body('name').notEmpty().withMessage('Tên bộ môn là bắt buộc'),
    body('description').optional(),
  ],
  async (req, res, next) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { name, description } = req.body;

      const [result] = await pool.query(
        'INSERT INTO departments (name, description) VALUES (?, ?)',
        [name, description || null]
      );

      const [newDept] = await pool.query(
        'SELECT * FROM departments WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newDept[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Cập nhật bộ môn (chỉ admin)
router.put(
  '/:id',
  authGuard,
  adminGuard,
  [
    body('name').optional().notEmpty().withMessage('Tên bộ môn không được để trống'),
  ],
  async (req, res, next) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Check if department exists
      const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [id]);
      if (!existing.length) {
        return res.status(404).json(errorResponse('Không tìm thấy bộ môn'));
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(errorResponse('Không có dữ liệu để cập nhật'));
      }

      await pool.query('UPDATE departments SET ? WHERE id = ?', [updateData, id]);

      const [updated] = await pool.query(
        'SELECT * FROM departments WHERE id = ?',
        [id]
      );

      res.json(updated[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Xóa bộ môn (chỉ admin)
router.delete('/:id', authGuard, adminGuard, async (req, res, next) => {
  try {

    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json(errorResponse('Không tìm thấy bộ môn'));
    }

    await pool.query('DELETE FROM departments WHERE id = ?', [id]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Thêm giảng viên vào bộ môn (chỉ admin)
router.post(
  '/:id/lecturers',
  authGuard,
  adminGuard,
  [body('lecturer_id').isInt().withMessage('lecturer_id phải là số nguyên')],
  async (req, res, next) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Validation failed', errors.array()));
      }

      const { id } = req.params;
      const { lecturer_id } = req.body;

      // Kiểm tra bộ môn có tồn tại không
      const [dept] = await pool.query('SELECT id FROM departments WHERE id = ?', [id]);
      if (!dept.length) {
        return res.status(404).json(errorResponse('Không tìm thấy bộ môn'));
      }

      // Kiểm tra giảng viên có tồn tại không
      const [lect] = await pool.query('SELECT id, department_id FROM lecturers WHERE id = ?', [lecturer_id]);
      if (!lect.length) {
        return res.status(404).json(errorResponse('Không tìm thấy giảng viên'));
      }

      // Kiểm tra giảng viên đã thuộc bộ môn khác chưa
      if (lect[0].department_id && lect[0].department_id != id) {
        return res.status(409).json(errorResponse('Giảng viên đã thuộc bộ môn khác. Mỗi giảng viên chỉ có thể thuộc 1 bộ môn.'));
      }

      // Kiểm tra đã có trong bộ môn này chưa
      if (lect[0].department_id == id) {
        return res.status(409).json(errorResponse('Giảng viên đã có trong bộ môn này'));
      }

      // Cập nhật department_id của giảng viên
      await pool.query(
        'UPDATE lecturers SET department_id = ? WHERE id = ?',
        [id, lecturer_id]
      );

      const [lecturer] = await pool.query('SELECT * FROM lecturers WHERE id = ?', [lecturer_id]);

      res.status(201).json(lecturer[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Xóa giảng viên khỏi bộ môn (chỉ admin)
router.delete('/:id/lecturers/:lecturerId', authGuard, adminGuard, async (req, res, next) => {
  try {

    const { id, lecturerId } = req.params;

    // Kiểm tra giảng viên có tồn tại và thuộc bộ môn này không
    const [lect] = await pool.query(
      'SELECT id, department_id FROM lecturers WHERE id = ?',
      [lecturerId]
    );
    if (!lect.length) {
      return res.status(404).json(errorResponse('Không tìm thấy giảng viên'));
    }

    if (lect[0].department_id != id) {
      return res.status(404).json(errorResponse('Giảng viên không thuộc bộ môn này'));
    }

    // Xóa giảng viên khỏi bộ môn (đặt department_id thành NULL)
    await pool.query(
      'UPDATE lecturers SET department_id = NULL WHERE id = ?',
      [lecturerId]
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

