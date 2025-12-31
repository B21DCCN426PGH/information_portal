const express = require('express');
const pool = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');

const router = express.Router();

// GET /api/dashboard/stats - Thống kê tổng quan (yêu cầu authentication)
router.get('/stats', authGuard, adminGuard, async (req, res, next) => {
  try {
    const stats = {};

    // Đếm số nguyện vọng thực tập đang chờ duyệt
    try {
      const [pendingRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM student_enterprise_preferences WHERE status = 'pending'`
      );
      stats.pending_preferences = pendingRows[0].total || 0;
    } catch (err) {
      stats.pending_preferences = 0;
    }

    // Đếm số giảng viên
    try {
      const [lecturerRows] = await pool.query(`SELECT COUNT(*) AS total FROM lecturers`);
      stats.lecturers = lecturerRows[0].total || 0;
      stats.total_lecturers = lecturerRows[0].total || 0;
    } catch (err) {
      stats.lecturers = 0;
      stats.total_lecturers = 0;
    }

    // Đếm số doanh nghiệp
    try {
      const [enterpriseRows] = await pool.query(`SELECT COUNT(*) AS total FROM enterprises`);
      stats.enterprises = enterpriseRows[0].total || 0;
      stats.total_enterprises = enterpriseRows[0].total || 0;
    } catch (err) {
      stats.enterprises = 0;
      stats.total_enterprises = 0;
    }

    // Đếm số chuyên ngành
    try {
      const [majorRows] = await pool.query(`SELECT COUNT(*) AS total FROM majors`);
      stats.majors = majorRows[0].total || 0;
      stats.total_majors = majorRows[0].total || 0;
    } catch (err) {
      stats.majors = 0;
      stats.total_majors = 0;
    }

    // Đếm số sinh viên
    try {
      const [studentRows] = await pool.query(`SELECT COUNT(*) AS total FROM students`);
      stats.students = studentRows[0].total || 0;
      stats.total_students = studentRows[0].total || 0;
    } catch (err) {
      stats.students = 0;
      stats.total_students = 0;
    }

    // Đếm số tin tức
    try {
      const [newsRows] = await pool.query(`SELECT COUNT(*) AS total FROM news`);
      stats.news = newsRows[0].total || 0;
      stats.total_news = newsRows[0].total || 0;
    } catch (err) {
      stats.news = 0;
      stats.total_news = 0;
    }

    // Đếm số sự kiện
    try {
      const [eventRows] = await pool.query(`SELECT COUNT(*) AS total FROM events`);
      stats.events = eventRows[0].total || 0;
      stats.total_events = eventRows[0].total || 0;
    } catch (err) {
      stats.events = 0;
      stats.total_events = 0;
    }

    // Đếm số tuyển dụng
    try {
      const [recruitmentRows] = await pool.query(`SELECT COUNT(*) AS total FROM recruitment_posts`);
      stats.recruitment = recruitmentRows[0].total || 0;
      stats.total_recruitment = recruitmentRows[0].total || 0;
    } catch (err) {
      stats.recruitment = 0;
      stats.total_recruitment = 0;
    }

    // Thống kê giảng viên theo bộ môn
    try {
      const [lecturerByDeptRows] = await pool.query(
        `SELECT 
          d.id,
          d.name AS department_name,
          COUNT(l.id) AS lecturer_count
        FROM departments d
        LEFT JOIN lecturers l ON d.id = l.department_id
        GROUP BY d.id, d.name
        ORDER BY d.name`
      );
      
      // Đếm giảng viên chưa có bộ môn
      const [unassignedRows] = await pool.query(
        `SELECT COUNT(*) AS lecturer_count FROM lecturers WHERE department_id IS NULL`
      );
      const unassignedCount = unassignedRows[0]?.lecturer_count || 0;
      
      // Thêm dòng "Chưa phân loại" nếu có giảng viên chưa có bộ môn
      const result = [...lecturerByDeptRows];
      if (unassignedCount > 0) {
        result.push({
          id: null,
          department_name: 'Chưa phân loại',
          lecturer_count: unassignedCount
        });
      }
      
      stats.lecturers_by_department = result;
    } catch (err) {
      stats.lecturers_by_department = [];
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

