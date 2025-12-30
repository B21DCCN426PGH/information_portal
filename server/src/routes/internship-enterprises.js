const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');

// GET /api/internship-enterprises - Lấy danh sách doanh nghiệp thực tập (public cho sinh viên, admin có thể quản lý)
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM internship_enterprises';
    const params = [];

    if (is_active !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(is_active === 'true' || is_active === true);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching internship enterprises:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách doanh nghiệp thực tập' });
  }
});

// GET /api/internship-enterprises/:id - Lấy chi tiết doanh nghiệp
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM internship_enterprises WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching internship enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin doanh nghiệp' });
  }
});

// POST /api/internship-enterprises - Tạo doanh nghiệp mới (Admin only)
router.post('/', authGuard, adminGuard, async (req, res) => {
  try {
    const { name, job_description, address, contact_info, is_active, max_slots } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên doanh nghiệp là bắt buộc' });
    }

    const [result] = await db.query(
      `INSERT INTO internship_enterprises (name, job_description, address, contact_info, is_active, max_slots)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, job_description || null, address || null, contact_info || null, is_active !== undefined ? is_active : true, max_slots || 10]
    );

    // Lấy dữ liệu vừa tạo
    const [newEnterprise] = await db.query(
      'SELECT * FROM internship_enterprises WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newEnterprise[0]);
  } catch (error) {
    console.error('Error creating internship enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi tạo doanh nghiệp' });
  }
});

// PUT /api/internship-enterprises/:id - Cập nhật doanh nghiệp (Admin only)
router.put('/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, job_description, address, contact_info, is_active, max_slots } = req.body;

    // Kiểm tra doanh nghiệp có tồn tại không
    const [existing] = await db.query(
      'SELECT * FROM internship_enterprises WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    await db.query(
      `UPDATE internship_enterprises 
       SET name = ?, job_description = ?, address = ?, contact_info = ?, is_active = ?, max_slots = ?
       WHERE id = ?`,
      [name, job_description || null, address || null, contact_info || null, is_active !== undefined ? is_active : true, max_slots || 10, id]
    );

    // Lấy dữ liệu đã cập nhật
    const [updated] = await db.query(
      'SELECT * FROM internship_enterprises WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating internship enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật doanh nghiệp' });
  }
});

// DELETE /api/internship-enterprises/:id - Xóa doanh nghiệp (Admin only)
router.delete('/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra doanh nghiệp có tồn tại không
    const [existing] = await db.query(
      'SELECT * FROM internship_enterprises WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    await db.query('DELETE FROM internship_enterprises WHERE id = ?', [id]);
    res.json({ message: 'Xóa doanh nghiệp thành công' });
  } catch (error) {
    console.error('Error deleting internship enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi xóa doanh nghiệp' });
  }
});

module.exports = router;

