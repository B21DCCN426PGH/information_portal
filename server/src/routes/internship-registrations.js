const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const XLSX = require('xlsx');

// GET /api/internship-registrations/my-lecturer - Lấy đăng ký giảng viên của sinh viên hiện tại
router.get('/my-lecturer', authGuard, async (req, res) => {
  try {
    const studentId = req.user.id; // Từ JWT token
    const { period_id } = req.query;

    let query = `
      SELECT 
        slr.id,
        slr.student_id,
        slr.lecturer_period_id,
        slr.status,
        slr.notes,
        slr.registered_at,
        slr.reviewed_at,
        lp.lecturer_id,
        lp.period_id,
        l.name AS lecturer_name,
        l.email AS lecturer_email,
        l.phone AS lecturer_phone,
        ip.name AS period_name
      FROM student_lecturer_registrations slr
      INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
      INNER JOIN lecturers l ON lp.lecturer_id = l.id
      INNER JOIN internship_periods ip ON lp.period_id = ip.id
      WHERE slr.student_id = ?
    `;
    const params = [studentId];

    if (period_id) {
      query += ' AND lp.period_id = ?';
      params.push(period_id);
    }

    query += ' ORDER BY slr.registered_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching student lecturer registration:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin đăng ký giảng viên' });
  }
});

// POST /api/internship-registrations/lecturer - Đăng ký giảng viên hướng dẫn (Sinh viên)
router.post('/lecturer', authGuard, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { period_id, lecturer_id } = req.body;

    if (!period_id || !lecturer_id) {
      return res.status(400).json({ error: 'Thiếu period_id hoặc lecturer_id' });
    }

    console.log('Register lecturer request:', { studentId, period_id, lecturer_id });

    // Kiểm tra đợt đăng ký có đang hoạt động và trong thời gian đăng ký không
    const [periods] = await db.query(
      'SELECT * FROM internship_periods WHERE id = ? AND is_active = TRUE',
      [period_id]
    );

    if (periods.length === 0) {
      return res.status(400).json({ error: 'Đợt đăng ký không tồn tại hoặc không đang hoạt động' });
    }

    const period = periods[0];
    const now = new Date();
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);

    if (now < startDate || now > endDate) {
      return res.status(400).json({ error: 'Không trong thời gian đăng ký' });
    }

    // Tìm lecturer_period_id từ lecturer_id và period_id
    const [lecturerPeriod] = await db.query(
      'SELECT * FROM lecturer_periods WHERE period_id = ? AND lecturer_id = ?',
      [period_id, lecturer_id]
    );

    if (lecturerPeriod.length === 0 || !lecturerPeriod[0].can_guide) {
      return res.status(400).json({ error: 'Giảng viên này không thể hướng dẫn trong đợt này' });
    }

    const lecturerPeriodId = lecturerPeriod[0].id;
    const lp = lecturerPeriod[0];
    
    // Kiểm tra slot
    if (lp.current_slots >= lp.max_slots) {
      return res.status(400).json({ error: 'Giảng viên này đã hết slot' });
    }

    // Kiểm tra sinh viên đã đăng ký trong đợt này chưa
    // Chỉ sử dụng lecturer_period_id, JOIN với lecturer_periods để lấy period_id
    const [existing] = await db.query(
      `SELECT slr.*, lp.lecturer_id, lp.period_id
       FROM student_lecturer_registrations slr
       INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
       WHERE slr.student_id = ? AND lp.period_id = ?`,
      [studentId, period_id]
    );

    const isUpdate = existing.length > 0;
    const oldLecturerPeriodId = isUpdate ? existing[0].lecturer_period_id : null;

    // Nếu đang thay đổi sang cùng giảng viên, không cần làm gì
    if (isUpdate && oldLecturerPeriodId === lecturerPeriodId) {
      return res.status(400).json({ error: 'Bạn đã đăng ký giảng viên này rồi' });
    }

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      if (isUpdate) {
        // Cập nhật đăng ký hiện có
        await db.query(
          `UPDATE student_lecturer_registrations 
           SET lecturer_period_id = ?, reviewed_at = NOW()
           WHERE student_id = ? AND lecturer_period_id = ?`,
          [lecturerPeriodId, studentId, oldLecturerPeriodId]
        );

        // Giảm current_slots của giảng viên cũ
        await db.query(
          `UPDATE lecturer_periods
           SET current_slots = GREATEST(0, current_slots - 1)
           WHERE id = ?`,
          [oldLecturerPeriodId]
        );

        // Tăng current_slots của giảng viên mới
        await db.query(
          `UPDATE lecturer_periods
           SET current_slots = current_slots + 1
           WHERE id = ?`,
          [lecturerPeriodId]
        );
      } else {
        // Tạo đăng ký mới với status = 'approved' (tự động duyệt)
        // Chỉ insert lecturer_period_id (các cột lecturer_id và period_id đã bị xóa)
        await db.query(
          `INSERT INTO student_lecturer_registrations (student_id, lecturer_period_id, status, reviewed_at)
           VALUES (?, ?, 'approved', NOW())`,
          [studentId, lecturerPeriodId]
        );

        // Tự động tăng current_slots
        await db.query(
          `UPDATE lecturer_periods
           SET current_slots = current_slots + 1
           WHERE id = ?`,
          [lecturerPeriodId]
        );
      }

      await db.query('COMMIT');

      res.status(isUpdate ? 200 : 201).json({
        message: isUpdate ? 'Thay đổi giảng viên thành công' : 'Đăng ký giảng viên thành công',
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error registering lecturer:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: 'Lỗi khi đăng ký giảng viên',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/internship-registrations/my-preferences - Lấy nguyện vọng thực tập của sinh viên hiện tại
router.get('/my-preferences', authGuard, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { period_id } = req.query;

    let query = `
      SELECT 
        sep.id,
        sep.student_id,
        pe.period_id,
        sep.period_enterprise_id AS enterprise_id,
        sep.preference_order,
        sep.notes,
        sep.status,
        sep.registered_at,
        sep.reviewed_at,
        pe.name AS enterprise_name,
        pe.job_description,
        pe.address AS enterprise_address,
        pe.contact_info AS enterprise_contact,
        ip.name AS period_name
      FROM student_enterprise_preferences sep
      INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
      INNER JOIN internship_periods ip ON pe.period_id = ip.id
      WHERE sep.student_id = ?
    `;
    const params = [studentId];

    if (period_id) {
      query += ' AND pe.period_id = ?';
      params.push(period_id);
    }

    query += ' ORDER BY pe.period_id DESC, sep.preference_order ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching student preferences:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin nguyện vọng' });
  }
});

// POST /api/internship-registrations/preferences - Đăng ký nguyện vọng thực tập (Sinh viên)
router.post('/preferences', authGuard, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { period_id, preferences, notes } = req.body; // preferences là mảng [{enterprise_id, preference_order}]

    if (!period_id || !Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({ error: 'Thiếu period_id hoặc danh sách nguyện vọng không hợp lệ' });
    }

    if (preferences.length > 5) {
      return res.status(400).json({ error: 'Chỉ được đăng ký tối đa 5 nguyện vọng' });
    }

    // Kiểm tra đợt đăng ký
    const [periods] = await db.query(
      'SELECT * FROM internship_periods WHERE id = ? AND is_active = TRUE',
      [period_id]
    );

    if (periods.length === 0) {
      return res.status(400).json({ error: 'Đợt đăng ký không tồn tại hoặc không đang hoạt động' });
    }

    const period = periods[0];
    const now = new Date();
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);

    if (now < startDate || now > endDate) {
      return res.status(400).json({ error: 'Không trong thời gian đăng ký' });
    }

    // Kiểm tra sinh viên đã đăng ký giảng viên hướng dẫn chưa
    const [lecturerRegistration] = await db.query(
      `SELECT slr.* 
       FROM student_lecturer_registrations slr
       INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
       WHERE slr.student_id = ? AND lp.period_id = ?`,
      [studentId, period_id]
    );

    if (lecturerRegistration.length === 0) {
      return res.status(400).json({ error: 'Bạn phải đăng ký giảng viên hướng dẫn trước khi đăng ký nguyện vọng thực tập' });
    }

    // Kiểm tra sinh viên đã đăng ký nguyện vọng trong đợt này chưa
    // Lấy period_id từ period_enterprises thông qua period_enterprise_id
    const [existing] = await db.query(
      `SELECT sep.* 
       FROM student_enterprise_preferences sep
       INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
       WHERE sep.student_id = ? AND pe.period_id = ?`,
      [studentId, period_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bạn đã đăng ký nguyện vọng trong đợt này rồi' });
    }

    // Kiểm tra nguyện vọng
    const orders = preferences.map(p => p.preference_order).sort();
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        return res.status(400).json({ error: 'Thứ tự nguyện vọng phải từ 1 đến 5 và không được trùng' });
      }
    }

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      for (const pref of preferences) {
        const { enterprise_id, preference_order } = pref; // enterprise_id từ frontend vẫn giữ tên này

        // Kiểm tra doanh nghiệp có tồn tại và đang hoạt động trong đợt này không
        // enterprise_id ở đây là ID của period_enterprises
        const [periodEnterprises] = await db.query(
          `SELECT * FROM period_enterprises
           WHERE id = ? AND period_id = ? AND is_active = TRUE`,
          [enterprise_id, period_id]
        );

        if (periodEnterprises.length === 0) {
          throw new Error(`Doanh nghiệp ID ${enterprise_id} không tồn tại hoặc không hoạt động trong đợt đăng ký này`);
        }

        // Kiểm tra còn slot không
        const pe = periodEnterprises[0];
        if (pe.current_slots >= pe.max_slots) {
          throw new Error(`Doanh nghiệp "${pe.name}" đã hết slot trong đợt này`);
        }

        // enterprise_id ở đây là ID của period_enterprises
        await db.query(
          `INSERT INTO student_enterprise_preferences 
           (student_id, period_enterprise_id, preference_order, notes, status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [studentId, enterprise_id, preference_order, notes || null]
        );
      }

      await db.query('COMMIT');
      res.status(201).json({ message: 'Đăng ký nguyện vọng thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error registering preferences:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi đăng ký nguyện vọng' });
  }
});

// GET /api/internship-registrations/all - Lấy tất cả đăng ký (Admin only)
router.get('/all', authGuard, adminGuard, async (req, res) => {
  try {
    const { type, period_id } = req.query; // type: 'lecturer' hoặc 'preferences' (giảng viên hoặc nguyện vọng)

    if (type === 'lecturer') {
      let query = `
        SELECT 
          slr.id,
          slr.student_id,
          slr.lecturer_period_id,
          slr.status,
          slr.notes,
          slr.registered_at,
          slr.reviewed_at,
          s.student_code,
          s.name AS student_name,
          lp.lecturer_id,
          lp.period_id,
          l.name AS lecturer_name,
          ip.name AS period_name
        FROM student_lecturer_registrations slr
        INNER JOIN students s ON slr.student_id = s.id
        INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
        INNER JOIN lecturers l ON lp.lecturer_id = l.id
        INNER JOIN internship_periods ip ON lp.period_id = ip.id
        WHERE 1=1
      `;
      const params = [];

      if (period_id) {
        query += ' AND lp.period_id = ?';
        params.push(period_id);
      }

      query += ' ORDER BY slr.registered_at DESC';

      const [rows] = await db.query(query, params);
      return res.json(rows);
    } else if (type === 'preferences') {
      let query = `
        SELECT 
          sep.id,
          sep.student_id,
          pe.period_id,
          sep.period_enterprise_id AS enterprise_id,
          sep.preference_order,
          sep.notes,
          sep.status,
          sep.registered_at,
          sep.reviewed_at,
          s.student_code,
          s.name AS student_name,
          s.gpa AS student_gpa,
          pe.name AS enterprise_name,
          pe.max_slots AS enterprise_max_slots,
          pe.current_slots AS enterprise_current_slots,
          (pe.max_slots - pe.current_slots) AS enterprise_available_slots,
          ip.name AS period_name
        FROM student_enterprise_preferences sep
        INNER JOIN students s ON sep.student_id = s.id
        INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
        INNER JOIN internship_periods ip ON pe.period_id = ip.id
        WHERE 1=1
      `;
      const params = [];

      if (period_id) {
        query += ' AND pe.period_id = ?';
        params.push(period_id);
      }

      query += ' ORDER BY pe.period_id DESC, sep.student_id, sep.preference_order ASC';

      const [rows] = await db.query(query, params);
      return res.json(rows);
    } else {
      return res.status(400).json({ error: 'Thiếu hoặc sai tham số type (phải là "lecturer" hoặc "preferences")' });
    }
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đăng ký' });
  }
});

// PUT /api/internship-registrations/lecturer/:id/status - Cập nhật trạng thái đăng ký giảng viên (Admin only)
router.put('/lecturer/:id/status', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    await db.query(
      `UPDATE student_lecturer_registrations 
       SET status = ?, notes = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, notes || null, id]
    );

    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái' });
  }
});

// PUT /api/internship-registrations/preference/:id/status - Cập nhật trạng thái nguyện vọng (Admin only)
router.put('/preference/:id/status', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, intern_at_academy } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    // Lấy thông tin nguyện vọng hiện tại
    const [preferences] = await db.query(
      `SELECT sep.student_id, pe.period_id 
       FROM student_enterprise_preferences sep
       INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
       WHERE sep.id = ?`,
      [id]
    );

    if (preferences.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nguyện vọng' });
    }

    const { student_id, period_id } = preferences[0];
    
    // Nếu duyệt và có yêu cầu thực tập tại Học viện, tìm đơn vị Học viện
    let academyEnterpriseId = null;
    if (status === 'approved' && intern_at_academy) {
      const [academyEnterprise] = await db.query(
        `SELECT id FROM period_enterprises 
         WHERE period_id = ? AND name = 'Học viện Công nghệ Bưu chính Viễn thông'`,
        [period_id]
      );
      
      if (academyEnterprise.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn vị thực tập Học viện Công nghệ Bưu chính Viễn thông trong đợt này' });
      }
      
      academyEnterpriseId = academyEnterprise[0].id;
    }

    // Lấy thông tin period_enterprise_id từ nguyện vọng
    const [prefData] = await db.query(
      'SELECT period_enterprise_id FROM student_enterprise_preferences WHERE id = ?',
      [id]
    );

    if (prefData.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nguyện vọng' });
    }

    const enterprise_id = prefData[0].period_enterprise_id;

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      // Lấy trạng thái cũ
      const [oldPref] = await db.query(
        'SELECT status FROM student_enterprise_preferences WHERE id = ?',
        [id]
      );
      const oldStatus = oldPref[0]?.status;

      // Xác định enterprise_id cuối cùng (nếu thực tập tại Học viện thì dùng academyEnterpriseId)
      const finalEnterpriseId = (status === 'approved' && intern_at_academy && academyEnterpriseId) 
        ? academyEnterpriseId 
        : enterprise_id;

      if (status === 'approved') {
        // Kiểm tra doanh nghiệp còn slot không trong đợt này
        const [periodEnterprise] = await db.query(
          `SELECT max_slots, current_slots FROM period_enterprises 
           WHERE id = ? AND period_id = ? AND is_active = TRUE`,
          [finalEnterpriseId, period_id]
        );

        if (periodEnterprise.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ error: 'Doanh nghiệp không tồn tại trong đợt đăng ký này' });
        }

        if (periodEnterprise[0].current_slots >= periodEnterprise[0].max_slots) {
          await db.query('ROLLBACK');
          return res.status(400).json({ error: 'Doanh nghiệp này đã hết slot trong đợt này' });
        }

        // Nếu thực tập tại Học viện, tạo preference mới cho Học viện
        if (intern_at_academy && academyEnterpriseId) {
          // Kiểm tra xem đã có preference cho Học viện chưa
          const [existingAcademyPref] = await db.query(
            `SELECT sep.id 
             FROM student_enterprise_preferences sep
             INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
             WHERE sep.student_id = ? AND pe.period_id = ? AND sep.period_enterprise_id = ?`,
            [student_id, period_id, academyEnterpriseId]
          );

          let academyPreferenceId;
          if (existingAcademyPref.length > 0) {
            academyPreferenceId = existingAcademyPref[0].id;
          } else {
            // Tạo preference mới cho Học viện
            // Lấy max order từ các preferences của sinh viên trong cùng period (thông qua period_enterprises)
            const [maxOrder] = await db.query(
              `SELECT COALESCE(MAX(sep.preference_order), 0) + 1 AS next_order 
               FROM student_enterprise_preferences sep
               INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
               WHERE sep.student_id = ? AND pe.period_id = ?`,
              [student_id, period_id]
            );
            const nextOrder = maxOrder[0].next_order;

            const [academyPrefResult] = await db.query(
              `INSERT INTO student_enterprise_preferences 
               (student_id, period_enterprise_id, preference_order, notes, status)
               VALUES (?, ?, ?, ?, 'approved')`,
              [student_id, academyEnterpriseId, nextOrder, null]
            );
            academyPreferenceId = academyPrefResult.insertId;
          }

          // Từ chối tất cả các nguyện vọng khác (bao gồm cả nguyện vọng hiện tại)
          await db.query(
            `UPDATE student_enterprise_preferences 
             SET status = 'rejected', reviewed_at = NOW()
             WHERE student_id = ? AND period_enterprise_id IN (
               SELECT id FROM period_enterprises WHERE period_id = ?
             ) AND id != ?`,
            [student_id, period_id, academyPreferenceId]
          );

          // Giảm current_slots của các doanh nghiệp khác nếu đã được duyệt trước đó
          const [otherApproved] = await db.query(
            `SELECT sep.period_enterprise_id AS enterprise_id 
             FROM student_enterprise_preferences sep
             INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
             WHERE sep.student_id = ? AND pe.period_id = ? AND sep.id != ? AND sep.status = 'approved'`,
            [student_id, period_id, academyPreferenceId]
          );

          for (const other of otherApproved) {
            await db.query(
              `UPDATE period_enterprises
               SET current_slots = GREATEST(0, current_slots - 1)
               WHERE id = ?`,
              [other.enterprise_id]
            );
          }

          // Tăng current_slots của Học viện
          await db.query(
            `UPDATE period_enterprises
             SET current_slots = current_slots + 1
             WHERE id = ?`,
            [academyEnterpriseId]
          );
        } else {
          // Logic duyệt bình thường (không thực tập tại Học viện)
          // Khi duyệt 1 nguyện vọng, tự động từ chối 4 nguyện vọng còn lại của cùng sinh viên trong cùng đợt
          await db.query(
            `UPDATE student_enterprise_preferences 
             SET status = 'rejected', reviewed_at = NOW()
             WHERE student_id = ? AND period_enterprise_id IN (
               SELECT id FROM period_enterprises WHERE period_id = ?
             ) AND id != ? AND status = 'pending'`,
            [student_id, period_id, id]
          );

          // Giảm current_slots của các doanh nghiệp khác nếu đã được duyệt trước đó
          const [otherApproved] = await db.query(
            `SELECT sep.period_enterprise_id AS enterprise_id 
             FROM student_enterprise_preferences sep
             INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
             WHERE sep.student_id = ? AND pe.period_id = ? AND sep.id != ? AND sep.status = 'approved'`,
            [student_id, period_id, id]
          );

          for (const other of otherApproved) {
            await db.query(
              `UPDATE period_enterprises
               SET current_slots = GREATEST(0, current_slots - 1)
               WHERE id = ?`,
              [other.enterprise_id]
            );
          }

          // Tăng current_slots của doanh nghiệp được duyệt trong đợt này
          await db.query(
            `UPDATE period_enterprises
             SET current_slots = current_slots + 1
             WHERE id = ?`,
            [enterprise_id]
          );

          // Cập nhật trạng thái nguyện vọng được chọn
          await db.query(
            `UPDATE student_enterprise_preferences 
             SET status = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [status, id]
          );
        }
      } else if (oldStatus === 'approved' && status !== 'approved') {
        // Nếu đang từ chối/hủy một nguyện vọng đã được duyệt, giảm current_slots trong đợt này
        await db.query(
          `UPDATE period_enterprises
           SET current_slots = GREATEST(0, current_slots - 1)
           WHERE id = ?`,
          [enterprise_id]
        );
      }

      // Cập nhật trạng thái nguyện vọng được chọn
      await db.query(
        `UPDATE student_enterprise_preferences 
         SET status = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [status, id]
      );

      await db.query('COMMIT');
      res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating preference status:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái' });
  }
});

// GET /api/internship-registrations/results - Lấy kết quả đăng ký thực tập (Admin only)
router.get('/results', authGuard, adminGuard, async (req, res) => {
  try {
    const { period_id, lecturer_id, enterprise_id, type } = req.query;

    // Nếu có enterprise_id, lấy danh sách sinh viên đã đăng ký đơn vị thực tập cụ thể
    if (enterprise_id) {
      let query = `
        SELECT 
          sep.id AS registration_id,
          s.id AS student_id,
          s.student_code,
          s.name AS student_name,
          s.class_name,
          s.phone,
          s.email,
          sep.status AS registration_status,
          sep.registered_at,
          COALESCE(
            (SELECT l.name 
             FROM student_lecturer_registrations slr
             INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
             INNER JOIN lecturers l ON lp.lecturer_id = l.id
             WHERE slr.student_id = s.id 
               AND lp.period_id = pe.period_id 
               AND slr.status = 'approved'
             LIMIT 1),
            'Chưa có'
          ) AS lecturer_name
        FROM student_enterprise_preferences sep
        INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
        INNER JOIN students s ON sep.student_id = s.id
        WHERE sep.period_enterprise_id = ? AND sep.status = 'approved'
      `;
      const params = [enterprise_id];

      if (period_id) {
        query += ' AND pe.period_id = ?';
        params.push(period_id);
      }

      query += ' ORDER BY sep.registered_at ASC';

      const [rows] = await db.query(query, params);
      return res.json(rows);
    }

    // Nếu có lecturer_id, lấy danh sách sinh viên đã đăng ký giảng viên cụ thể
    if (lecturer_id) {
      let query = `
        SELECT 
          slr.id AS registration_id,
          s.id AS student_id,
          s.student_code,
          s.name AS student_name,
          s.class_name,
          s.phone,
          s.email,
          slr.status AS registration_status,
          slr.registered_at,
          lp.period_id,
          COALESCE(
            (SELECT pe.name 
             FROM student_enterprise_preferences sep
             INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
             WHERE sep.student_id = s.id 
               AND pe.period_id = lp.period_id 
               AND sep.status = 'approved'
             LIMIT 1),
            NULL
          ) AS approved_enterprise_name
        FROM student_lecturer_registrations slr
        INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
        INNER JOIN students s ON slr.student_id = s.id
        WHERE lp.lecturer_id = ? AND slr.status = 'approved'
      `;
      const params = [lecturer_id];

      if (period_id) {
        query += ' AND lp.period_id = ?';
        params.push(period_id);
      }

      query += ' ORDER BY slr.registered_at ASC';

      const [rows] = await db.query(query, params);
      return res.json(rows);
    }

    // Nếu type = 'enterprises', lấy danh sách đơn vị thực tập có sinh viên đã đăng ký
    if (type === 'enterprises') {
      let query = `
        SELECT 
          pe.id AS enterprise_id,
          pe.name AS enterprise_name,
          pe.address AS enterprise_address,
          pe.contact_info AS enterprise_contact,
          COUNT(DISTINCT sep.student_id) AS student_count,
          pe.max_slots,
          pe.current_slots
        FROM period_enterprises pe
        INNER JOIN student_enterprise_preferences sep ON pe.id = sep.period_enterprise_id
        WHERE sep.status = 'approved'
      `;
      const params = [];

      if (period_id) {
        query += ' AND pe.period_id = ?';
        params.push(period_id);
      }

      query += ' GROUP BY pe.id, pe.name, pe.address, pe.contact_info, pe.max_slots, pe.current_slots ORDER BY pe.name ASC';

      const [rows] = await db.query(query, params);
      return res.json(rows);
    }

    // Mặc định: Lấy danh sách giảng viên có sinh viên đã đăng ký
    let query = `
      SELECT 
        l.id AS lecturer_id,
        l.name AS lecturer_name,
        l.email AS lecturer_email,
        l.phone AS lecturer_phone,
        COUNT(DISTINCT slr.student_id) AS student_count,
        lp.max_slots,
        lp.current_slots
      FROM lecturers l
      INNER JOIN lecturer_periods lp ON l.id = lp.lecturer_id
      INNER JOIN student_lecturer_registrations slr ON lp.id = slr.lecturer_period_id
      WHERE slr.status = 'approved'
    `;
    const params = [];

    if (period_id) {
      query += ' AND lp.period_id = ?';
      params.push(period_id);
    }

    query += ' GROUP BY l.id, l.name, l.email, l.phone, lp.max_slots, lp.current_slots ORDER BY l.name ASC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching internship results:', error);
    res.status(500).json({ error: 'Lỗi khi lấy kết quả đăng ký thực tập' });
  }
});

// GET /api/internship-registrations/results/export - Xuất Excel kết quả đăng ký thực tập (Admin only)
router.get('/results/export', authGuard, adminGuard, async (req, res) => {
  try {
    const { period_id, lecturer_id, enterprise_id, type } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'Thiếu period_id' });
    }

    // Lấy thông tin đợt đăng ký
    const [periods] = await db.query('SELECT name FROM internship_periods WHERE id = ?', [period_id]);
    if (periods.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đợt đăng ký' });
    }
    const periodName = periods[0].name;

    if (enterprise_id) {
      // Xuất Excel cho một đơn vị thực tập cụ thể
      const [enterpriseInfo] = await db.query('SELECT name FROM period_enterprises WHERE id = ?', [enterprise_id]);
      if (enterpriseInfo.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn vị thực tập' });
      }

      const [students] = await db.query(
        `SELECT 
          s.student_code,
          s.name AS student_name,
          s.class_name,
          s.phone,
          s.email,
          COALESCE(
            (SELECT l.name 
             FROM student_lecturer_registrations slr
             INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
             INNER JOIN lecturers l ON lp.lecturer_id = l.id
             WHERE slr.student_id = s.id 
               AND lp.period_id = ? 
               AND slr.status = 'approved'
             LIMIT 1),
            'Chưa có'
          ) AS lecturer_name
        FROM student_enterprise_preferences sep
        INNER JOIN students s ON sep.student_id = s.id
        INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
        WHERE sep.period_enterprise_id = ? AND pe.period_id = ? AND sep.status = 'approved'
        ORDER BY sep.registered_at ASC`,
        [period_id, enterprise_id, period_id]
      );

      // Tạo workbook
      const workbook = XLSX.utils.book_new();
      
      // Tạo dữ liệu worksheet
      const worksheetData = [
        ['STT', 'Mã sinh viên', 'Họ và tên', 'Lớp', 'SĐT', 'Email', 'Giảng viên hướng dẫn'],
        ...students.map((s, index) => [
          index + 1,
          s.student_code || '',
          s.student_name || '',
          s.class_name || '',
          s.phone || '',
          s.email || '',
          s.lecturer_name || 'Chưa có'
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Thiết lập độ rộng cột
      worksheet['!cols'] = [
        { wch: 5 },  // STT
        { wch: 15 }, // Mã sinh viên
        { wch: 25 }, // Họ và tên
        { wch: 15 }, // Lớp
        { wch: 15 }, // SĐT
        { wch: 30 }, // Email
        { wch: 30 }  // Giảng viên
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách sinh viên');

      // Tạo buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Thiết lập headers
      const fileName = `Danh_sach_sinh_vien_${enterpriseInfo[0].name.replace(/\s+/g, '_')}_${periodName.replace(/\s+/g, '_')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    } else if (lecturer_id) {
      // Xuất Excel cho một giảng viên cụ thể
      const [lecturerInfo] = await db.query('SELECT name FROM lecturers WHERE id = ?', [lecturer_id]);
      if (lecturerInfo.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy giảng viên' });
      }

      const [students] = await db.query(
        `SELECT 
          s.student_code,
          s.name AS student_name,
          s.class_name,
          s.phone,
          s.email,
          COALESCE(
            (SELECT pe.name 
             FROM student_enterprise_preferences sep
             INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
             WHERE sep.student_id = s.id 
               AND pe.period_id = lp.period_id 
               AND sep.status = 'approved'
             LIMIT 1),
            'Chưa có'
          ) AS approved_enterprise_name
        FROM student_lecturer_registrations slr
        INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
        INNER JOIN students s ON slr.student_id = s.id
        WHERE lp.lecturer_id = ? AND lp.period_id = ? AND slr.status = 'approved'
        ORDER BY slr.registered_at ASC`,
        [lecturer_id, period_id]
      );

      // Tạo workbook
      const workbook = XLSX.utils.book_new();
      
      // Tạo dữ liệu worksheet
      const worksheetData = [
        ['STT', 'Mã sinh viên', 'Họ và tên', 'Lớp', 'SĐT', 'Email', 'Doanh nghiệp đã duyệt'],
        ...students.map((s, index) => [
          index + 1,
          s.student_code || '',
          s.student_name || '',
          s.class_name || '',
          s.phone || '',
          s.email || '',
          s.approved_enterprise_name || 'Chưa có'
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Thiết lập độ rộng cột
      worksheet['!cols'] = [
        { wch: 5 },  // STT
        { wch: 15 }, // Mã sinh viên
        { wch: 25 }, // Họ và tên
        { wch: 15 }, // Lớp
        { wch: 15 }, // SĐT
        { wch: 30 }, // Email
        { wch: 30 }  // Doanh nghiệp
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách sinh viên');

      // Tạo buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Thiết lập headers
      const fileName = `Danh_sach_sinh_vien_${lecturerInfo[0].name.replace(/\s+/g, '_')}_${periodName.replace(/\s+/g, '_')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    } else if (type === 'enterprises') {
      // Xuất Excel cho tất cả đơn vị thực tập (mỗi đơn vị một sheet)
      const [enterprises] = await db.query(
        `SELECT 
          pe.id AS enterprise_id,
          pe.name AS enterprise_name
        FROM period_enterprises pe
        INNER JOIN student_enterprise_preferences sep ON pe.id = sep.period_enterprise_id
        WHERE sep.status = 'approved' AND pe.period_id = ?
        GROUP BY pe.id, pe.name
        ORDER BY pe.name ASC`,
        [period_id]
      );

      if (enterprises.length === 0) {
        return res.status(404).json({ error: 'Không có đơn vị thực tập nào có sinh viên đã đăng ký' });
      }

      const workbook = XLSX.utils.book_new();

      // Tạo sheet cho mỗi đơn vị thực tập
      for (const enterprise of enterprises) {
        const [students] = await db.query(
          `SELECT 
            s.student_code,
            s.name AS student_name,
            s.class_name,
            s.phone,
            s.email,
            COALESCE(
              (SELECT l.name 
               FROM student_lecturer_registrations slr
               INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
               INNER JOIN lecturers l ON lp.lecturer_id = l.id
               WHERE slr.student_id = s.id 
                 AND lp.period_id = pe.period_id 
                 AND slr.status = 'approved'
               LIMIT 1),
              'Chưa có'
            ) AS lecturer_name
          FROM student_enterprise_preferences sep
          INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
          INNER JOIN students s ON sep.student_id = s.id
          WHERE sep.period_enterprise_id = ? AND pe.period_id = ? AND sep.status = 'approved'
          ORDER BY sep.registered_at ASC`,
          [enterprise.enterprise_id, period_id]
        );

        const worksheetData = [
          ['STT', 'Mã sinh viên', 'Họ và tên', 'Lớp', 'SĐT', 'Email', 'Giảng viên hướng dẫn'],
          ...students.map((s, index) => [
            index + 1,
            s.student_code || '',
            s.student_name || '',
            s.class_name || '',
            s.phone || '',
            s.email || '',
            s.lecturer_name || 'Chưa có'
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!cols'] = [
          { wch: 5 },  // STT
          { wch: 15 }, // Mã sinh viên
          { wch: 25 }, // Họ và tên
          { wch: 15 }, // Lớp
          { wch: 15 }, // SĐT
          { wch: 30 }, // Email
          { wch: 30 }  // Giảng viên
        ];

        // Tên sheet không được quá 31 ký tự
        const sheetName = enterprise.enterprise_name.length > 31 
          ? enterprise.enterprise_name.substring(0, 31) 
          : enterprise.enterprise_name;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const fileName = `Danh_sach_sinh_vien_theo_don_vi_${periodName.replace(/\s+/g, '_')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    } else {
      // Xuất Excel cho tất cả giảng viên (mỗi giảng viên một sheet) - mặc định
      const [lecturers] = await db.query(
        `SELECT 
          l.id AS lecturer_id,
          l.name AS lecturer_name
        FROM lecturers l
        INNER JOIN lecturer_periods lp ON l.id = lp.lecturer_id
        INNER JOIN student_lecturer_registrations slr ON lp.id = slr.lecturer_period_id
        WHERE slr.status = 'approved' AND lp.period_id = ?
        GROUP BY l.id, l.name
        ORDER BY l.name ASC`,
        [period_id]
      );

      if (lecturers.length === 0) {
        return res.status(404).json({ error: 'Không có giảng viên nào có sinh viên đã đăng ký' });
      }

      const workbook = XLSX.utils.book_new();

      // Tạo sheet cho mỗi giảng viên
      for (const lecturer of lecturers) {
        const [students] = await db.query(
          `SELECT 
            s.student_code,
            s.name AS student_name,
            s.class_name,
            s.phone,
            s.email,
            COALESCE(
              (SELECT pe.name 
               FROM student_enterprise_preferences sep
               INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
               WHERE sep.student_id = s.id 
                 AND pe.period_id = lp.period_id 
                 AND sep.status = 'approved'
               LIMIT 1),
              'Chưa có'
            ) AS approved_enterprise_name
          FROM student_lecturer_registrations slr
          INNER JOIN lecturer_periods lp ON slr.lecturer_period_id = lp.id
          INNER JOIN students s ON slr.student_id = s.id
          WHERE lp.lecturer_id = ? AND lp.period_id = ? AND slr.status = 'approved'
          ORDER BY slr.registered_at ASC`,
          [lecturer.lecturer_id, period_id]
        );

        const worksheetData = [
          ['STT', 'Mã sinh viên', 'Họ và tên', 'Lớp', 'SĐT', 'Email', 'Doanh nghiệp đã duyệt'],
          ...students.map((s, index) => [
            index + 1,
            s.student_code || '',
            s.student_name || '',
            s.class_name || '',
            s.phone || '',
            s.email || '',
            s.approved_enterprise_name || 'Chưa có'
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Thiết lập độ rộng cột
        worksheet['!cols'] = [
          { wch: 5 },  // STT
          { wch: 15 }, // Mã sinh viên
          { wch: 25 }, // Họ và tên
          { wch: 15 }, // Lớp
          { wch: 15 }, // SĐT
          { wch: 30 }, // Email
          { wch: 30 }  // Doanh nghiệp
        ];

        // Tên sheet tối đa 31 ký tự (giới hạn của Excel)
        const sheetName = lecturer.lecturer_name.length > 31 
          ? lecturer.lecturer_name.substring(0, 31) 
          : lecturer.lecturer_name;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      // Tạo buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Thiết lập headers
      const fileName = `Danh_sach_sinh_vien_${periodName.replace(/\s+/g, '_')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error exporting internship results:', error);
    res.status(500).json({ error: 'Lỗi khi xuất file Excel' });
  }
});

// POST /api/internship-registrations/approve-to-academy - Duyệt sinh viên vào Học viện (Admin only)
router.post('/approve-to-academy', authGuard, adminGuard, async (req, res) => {
  try {
    const { student_id, period_id } = req.body;

    if (!student_id || !period_id) {
      return res.status(400).json({ error: 'Thiếu student_id hoặc period_id' });
    }

    // Tìm đơn vị Học viện trong đợt này
    const [academyEnterprise] = await db.query(
      `SELECT id FROM period_enterprises 
       WHERE period_id = ? AND name = 'Học viện Công nghệ Bưu chính Viễn thông'`,
      [period_id]
    );

    if (academyEnterprise.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn vị thực tập Học viện Công nghệ Bưu chính Viễn thông trong đợt này' });
    }

    const academyEnterpriseId = academyEnterprise[0].id;

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      // Kiểm tra xem đã có preference cho Học viện chưa
      const [existingAcademyPref] = await db.query(
        `SELECT sep.id 
         FROM student_enterprise_preferences sep
         INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
         WHERE sep.student_id = ? AND pe.period_id = ? AND sep.period_enterprise_id = ?`,
        [student_id, period_id, academyEnterpriseId]
      );

      let academyPreferenceId;
      if (existingAcademyPref.length > 0) {
        academyPreferenceId = existingAcademyPref[0].id;
      } else {
        // Tạo preference mới cho Học viện
        // Dùng preference_order = 6 (nguyện vọng đặc biệt cho Học viện)
        // Sinh viên chỉ được đăng ký tối đa 5 nguyện vọng (1-5), nguyện vọng 6 dành cho Học viện
        const [academyPrefResult] = await db.query(
          `INSERT INTO student_enterprise_preferences 
           (student_id, period_enterprise_id, preference_order, notes, status)
           VALUES (?, ?, ?, ?, 'approved')`,
          [student_id, academyEnterpriseId, 6, null]
        );
        academyPreferenceId = academyPrefResult.insertId;
      }

      // Từ chối tất cả các nguyện vọng khác
      await db.query(
        `UPDATE student_enterprise_preferences 
         SET status = 'rejected', reviewed_at = NOW()
         WHERE student_id = ? AND period_enterprise_id IN (
           SELECT id FROM period_enterprises WHERE period_id = ?
         ) AND id != ?`,
        [student_id, period_id, academyPreferenceId]
      );

      // Giảm current_slots của các doanh nghiệp khác nếu đã được duyệt trước đó
      const [otherApproved] = await db.query(
        `SELECT sep.period_enterprise_id AS enterprise_id 
         FROM student_enterprise_preferences sep
         INNER JOIN period_enterprises pe ON sep.period_enterprise_id = pe.id
         WHERE sep.student_id = ? AND pe.period_id = ? AND sep.id != ? AND sep.status = 'approved'`,
        [student_id, period_id, academyPreferenceId]
      );

      for (const other of otherApproved) {
        await db.query(
          `UPDATE period_enterprises
           SET current_slots = GREATEST(0, current_slots - 1)
           WHERE id = ?`,
          [other.enterprise_id]
        );
      }

      // Tăng current_slots của Học viện
      await db.query(
        `UPDATE period_enterprises
         SET current_slots = current_slots + 1
         WHERE id = ?`,
        [academyEnterpriseId]
      );

      // Đảm bảo preference Học viện được duyệt
      await db.query(
        `UPDATE student_enterprise_preferences 
         SET status = 'approved', reviewed_at = NOW()
         WHERE id = ?`,
        [academyPreferenceId]
      );

      await db.query('COMMIT');
      res.json({ message: 'Duyệt sinh viên vào Học viện thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error approving student to academy:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi duyệt sinh viên vào Học viện' });
  }
});

module.exports = router;

