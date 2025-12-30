const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');

// GET /api/internship-lecturers - Lấy danh sách giảng viên hướng dẫn theo đợt
// Tham số query: period_id (bắt buộc), can_guide (tùy chọn: true/false)
router.get('/', async (req, res) => {
  try {
    const { period_id, can_guide } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'Thiếu period_id' });
    }

    let query = `
      SELECT 
        l.id,
        l.name,
        l.email,
        l.phone,
        l.academic_degree,
        l.academic_rank,
        l.research_direction,
        lp.period_id,
        lp.can_guide,
        lp.max_slots,
        lp.current_slots,
        (lp.max_slots - lp.current_slots) AS available_slots,
        d.name AS department_name
      FROM lecturers l
      LEFT JOIN lecturer_periods lp ON l.id = lp.lecturer_id AND lp.period_id = ?
      LEFT JOIN departments d ON l.department_id = d.id
      WHERE 1=1
    `;
    const params = [period_id];

    if (can_guide !== undefined) {
      query += ' AND lp.can_guide = ?';
      params.push(can_guide === 'true' || can_guide === true ? 1 : 0);
    }

    query += ' ORDER BY l.name ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching internship lecturers:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách giảng viên hướng dẫn' });
  }
});

// GET /api/internship-lecturers/available - Lấy danh sách giảng viên có thể hướng dẫn trong đợt (cho sinh viên)
router.get('/available', async (req, res) => {
  try {
    const { period_id } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'Thiếu period_id' });
    }

    const [rows] = await db.query(`
      SELECT 
        l.id,
        l.name,
        l.email,
        l.phone,
        l.academic_degree,
        l.academic_rank,
        l.research_direction,
        lp.max_slots,
        lp.current_slots,
        (lp.max_slots - lp.current_slots) AS available_slots,
        d.name AS department_name
      FROM lecturers l
      INNER JOIN lecturer_periods lp ON l.id = lp.lecturer_id
      LEFT JOIN departments d ON l.department_id = d.id
      WHERE lp.period_id = ? AND lp.can_guide = TRUE AND (lp.max_slots - lp.current_slots) > 0
      ORDER BY l.name ASC
    `, [period_id]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching available lecturers:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách giảng viên có thể hướng dẫn' });
  }
});

// POST /api/internship-lecturers - Tạo/cập nhật cấu hình giảng viên cho đợt (Admin only)
router.post('/', authGuard, adminGuard, async (req, res) => {
  try {
    const { period_id, lecturer_id, can_guide, max_slots } = req.body;

    if (!period_id || !lecturer_id) {
      return res.status(400).json({ error: 'Thiếu period_id hoặc lecturer_id' });
    }

    await db.query(
      `INSERT INTO lecturer_periods (period_id, lecturer_id, can_guide, max_slots)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       can_guide = VALUES(can_guide),
       max_slots = VALUES(max_slots)`,
      [period_id, lecturer_id, can_guide || false, max_slots || 10]
    );

    res.json({ message: 'Cập nhật cấu hình giảng viên thành công' });
  } catch (error) {
    console.error('Error updating lecturer period:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật cấu hình giảng viên' });
  }
});

// PUT /api/internship-lecturers/batch - Cập nhật hàng loạt giảng viên cho đợt (Admin only)
router.put('/batch', authGuard, adminGuard, async (req, res) => {
  try {
    const { period_id, lecturers } = req.body;

    if (!period_id || !Array.isArray(lecturers)) {
      return res.status(400).json({ error: 'Thiếu period_id hoặc danh sách giảng viên không hợp lệ' });
    }

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      for (const lecturer of lecturers) {
        const { lecturer_id, can_guide, max_slots } = lecturer;

        await db.query(
          `INSERT INTO lecturer_periods (period_id, lecturer_id, can_guide, max_slots)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           can_guide = VALUES(can_guide),
           max_slots = VALUES(max_slots)`,
          [period_id, lecturer_id, can_guide || false, max_slots || 10]
        );
      }

      await db.query('COMMIT');
      res.json({ message: 'Cập nhật hàng loạt thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error batch updating lecturers:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật hàng loạt giảng viên' });
  }
});

module.exports = router;

