const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    // const [[stats]] = await pool.query(
    //   `SELECT 
    //     (SELECT COUNT(*) FROM majors) AS total_majors,
    //     (SELECT COUNT(*) FROM lecturers) AS total_lecturers,
    //     (SELECT COUNT(*) FROM students) AS total_students,
    //     (SELECT COUNT(*) FROM enterprises) AS total_enterprises,
    //     (SELECT COUNT(*) FROM recruitment_posts) AS total_recruitment_posts`
    // );

    const stats = {
      total_majors: "10+",
      total_lecturers: "50+",
      total_students: "1000+",
      total_enterprises: "100+",
    };

    const [banners] = await pool.query('SELECT * FROM banners ORDER BY priority ASC, id DESC');
    const [events] = await pool.query(
      'SELECT * FROM events ORDER BY event_date DESC, created_at DESC LIMIT 3'
    );
    const [news] = await pool.query(
      'SELECT * FROM news ORDER BY published_at DESC, created_at DESC LIMIT 3'
    );
    const [admissions] = await pool.query(
      'SELECT * FROM admissions ORDER BY admission_year DESC LIMIT 3'
    );
    const [enterprises] = await pool.query(
      'SELECT id, name, logo_url, website FROM enterprises ORDER BY name ASC'
    );
    const [[facultyInfo]] = await pool.query(
      'SELECT name, phone, email, address, intro_video_url FROM faculty_information ORDER BY updated_at DESC LIMIT 1'
    );

    res.json({
      stats,
      banners,
      events,
      news,
      admissions,
      enterprises,
      facultyInfo: facultyInfo || null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

