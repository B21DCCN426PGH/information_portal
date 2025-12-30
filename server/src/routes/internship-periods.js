const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const validateInternshipPeriod = require('../middleware/validateInternshipPeriod');

// GET /api/internship-periods - Lấy danh sách đợt đăng ký
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_active,
        description,
        created_at,
        updated_at
      FROM internship_periods
      ORDER BY start_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching internship periods:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đợt đăng ký' });
  }
});

// GET /api/internship-periods/active - Lấy đợt đăng ký đang hoạt động
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_active,
        description
      FROM internship_periods
      WHERE is_active = TRUE
      ORDER BY start_date DESC
      LIMIT 1
    `);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không có đợt đăng ký đang hoạt động' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching active period:', error);
    res.status(500).json({ error: 'Lỗi khi lấy đợt đăng ký đang hoạt động' });
  }
});

// GET /api/internship-periods/:id - Lấy chi tiết đợt đăng ký
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM internship_periods WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đợt đăng ký' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching internship period:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin đợt đăng ký' });
  }
});

// POST /api/internship-periods - Tạo đợt đăng ký mới (Admin only)
router.post('/', authGuard, adminGuard, validateInternshipPeriod, async (req, res) => {
  try {
    const { name, start_date, end_date, description, is_active } = req.body;

    // Kiểm tra xem có đợt nào khác đang diễn ra trong khoảng thời gian này không
    // Overlap xảy ra khi: start_date <= new_end_date AND end_date >= new_start_date
    const [overlapping] = await db.query(
      `SELECT id, name, start_date, end_date 
       FROM internship_periods 
       WHERE start_date <= ? AND end_date >= ?`,
      [end_date, start_date]
    );

    if (overlapping.length > 0) {
      const overlappingPeriod = overlapping[0];
      return res.status(400).json({
        error: `Không thể tạo đợt đăng ký mới. Đã có đợt "${overlappingPeriod.name}" đang diễn ra trong khoảng thời gian này (${new Date(overlappingPeriod.start_date).toLocaleDateString('vi-VN')} - ${new Date(overlappingPeriod.end_date).toLocaleDateString('vi-VN')})`,
      });
    }

    // Nếu set đợt này là active, set tất cả đợt khác thành inactive
    if (is_active) {
      await db.query('UPDATE internship_periods SET is_active = FALSE');
    }

    const [result] = await db.query(
      `INSERT INTO internship_periods (name, start_date, end_date, description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [name, start_date, end_date, description || null, is_active || false]
    );

    const periodId = result.insertId;

    // Tự động tạo đơn vị thực tập "Học viện Công nghệ Bưu chính Viễn thông" cho đợt này
    try {
      await db.query(
        `INSERT INTO period_enterprises (period_id, name, job_description, address, contact_info, max_slots, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          periodId,
          'Học viện Công nghệ Bưu chính Viễn thông',
          'Thực tập tại Học viện Công nghệ Bưu chính Viễn thông',
          'Học viện Công nghệ Bưu chính Viễn thông',
          null,
          1000, // Số slot lớn để có thể nhận nhiều sinh viên
          true
        ]
      );
    } catch (error) {
      console.error('Error creating default academy enterprise:', error);
      // Không throw error để không ảnh hưởng đến việc tạo đợt
    }

    res.status(201).json({
      id: periodId,
      message: 'Tạo đợt đăng ký thành công',
    });
  } catch (error) {
    console.error('Error creating internship period:', error);
    res.status(500).json({ error: 'Lỗi khi tạo đợt đăng ký' });
  }
});

// PUT /api/internship-periods/:id - Cập nhật đợt đăng ký (Admin only)
router.put('/:id', authGuard, adminGuard, validateInternshipPeriod, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, description, is_active } = req.body;

    // Kiểm tra xem có đợt nào khác (trừ đợt hiện tại) đang diễn ra trong khoảng thời gian này không
    // Overlap xảy ra khi: start_date <= new_end_date AND end_date >= new_start_date
    const [overlapping] = await db.query(
      `SELECT id, name, start_date, end_date 
       FROM internship_periods 
       WHERE id != ? AND start_date <= ? AND end_date >= ?`,
      [id, end_date, start_date]
    );

    if (overlapping.length > 0) {
      const overlappingPeriod = overlapping[0];
      return res.status(400).json({
        error: `Không thể cập nhật đợt đăng ký. Đã có đợt "${overlappingPeriod.name}" đang diễn ra trong khoảng thời gian này (${new Date(overlappingPeriod.start_date).toLocaleDateString('vi-VN')} - ${new Date(overlappingPeriod.end_date).toLocaleDateString('vi-VN')})`,
      });
    }

    // Nếu set đợt này là active, set tất cả đợt khác thành inactive
    if (is_active) {
      await db.query('UPDATE internship_periods SET is_active = FALSE WHERE id != ?', [id]);
    }

    await db.query(
      `UPDATE internship_periods 
       SET name = ?, start_date = ?, end_date = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [name, start_date, end_date, description || null, is_active || false, id]
    );

    res.json({ message: 'Cập nhật đợt đăng ký thành công' });
  } catch (error) {
    console.error('Error updating internship period:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật đợt đăng ký' });
  }
});

// DELETE /api/internship-periods/:id - Xóa đợt đăng ký (Admin only)
router.delete('/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM internship_periods WHERE id = ?', [id]);
    res.json({ message: 'Xóa đợt đăng ký thành công' });
  } catch (error) {
    console.error('Error deleting internship period:', error);
    res.status(500).json({ error: 'Lỗi khi xóa đợt đăng ký' });
  }
});

module.exports = router;

