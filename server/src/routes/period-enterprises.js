const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const uploadExcel = require('../middleware/uploadExcel');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// GET /api/period-enterprises - Lấy danh sách doanh nghiệp theo đợt
// Tham số query: period_id (bắt buộc), is_active (tùy chọn)
router.get('/', async (req, res) => {
  try {
    const { period_id, is_active } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'period_id là bắt buộc' });
    }

    let query = `
      SELECT 
        pe.id,
        pe.period_id,
        pe.name,
        pe.job_description,
        pe.address,
        pe.contact_info,
        pe.max_slots,
        pe.current_slots,
        pe.is_active
      FROM period_enterprises pe
      WHERE pe.period_id = ?
    `;
    const params = [period_id];

    if (is_active !== undefined) {
      query += ' AND pe.is_active = ?';
      params.push(is_active === 'true' || is_active === true);
    }

    query += ' ORDER BY pe.name ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching period enterprises:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách doanh nghiệp theo đợt' });
  }
});

// GET /api/period-enterprises/template - Download Excel template (phải đặt trước /:id)
router.get('/template', authGuard, adminGuard, async (req, res) => {
  try {
    const templateData = [
      {
        'Tên doanh nghiệp': 'CMC Corporation',
        'Mô tả công việc': 'Phát triển phần mềm doanh nghiệp, hệ thống quản lý',
        'Địa chỉ': '11 Duy Tân, Cầu Giấy, Hà Nội',
        'Thông tin liên hệ': 'hr@cmc.com.vn',
        'Số slot tối đa': 10,
        'Đang hoạt động': 'Có'
      },
      {
        'Tên doanh nghiệp': 'FPT Software',
        'Mô tả công việc': 'Tham gia dự án thực tế về lập trình web, mobile',
        'Địa chỉ': 'FPT Tower, Phạm Văn Bạch, Cầu Giấy, Hà Nội',
        'Thông tin liên hệ': 'fresher@fsoft.com.vn',
        'Số slot tối đa': 10,
        'Đang hoạt động': 'Có'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doanh nghiệp');

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 25 }, // Tên doanh nghiệp
      { wch: 40 }, // Mô tả công việc
      { wch: 35 }, // Địa chỉ
      { wch: 25 }, // Thông tin liên hệ
      { wch: 15 }, // Số slot tối đa
      { wch: 15 }  // Đang hoạt động
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_doanh_nghiep.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Lỗi khi tạo template Excel' });
  }
});

// GET /api/period-enterprises/:id - Lấy chi tiết doanh nghiệp theo đợt
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM period_enterprises WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching period enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin doanh nghiệp' });
  }
});

// POST /api/period-enterprises - Thêm doanh nghiệp vào đợt (Admin only)
router.post('/', authGuard, adminGuard, async (req, res) => {
  try {
    const { period_id, name, job_description, address, contact_info, max_slots, is_active } = req.body;

    if (!period_id || !name) {
      return res.status(400).json({ error: 'period_id và name là bắt buộc' });
    }

    // Kiểm tra xem đã tồn tại chưa (theo tên trong cùng đợt)
    const [existing] = await db.query(
      'SELECT id FROM period_enterprises WHERE period_id = ? AND name = ?',
      [period_id, name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Doanh nghiệp này đã được thêm vào đợt này' });
    }

    const [result] = await db.query(
      `INSERT INTO period_enterprises (period_id, name, job_description, address, contact_info, max_slots, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        period_id, 
        name, 
        job_description || null, 
        address || null, 
        contact_info || null, 
        max_slots || 10, 
        is_active !== undefined ? is_active : true
      ]
    );

    // Lấy dữ liệu vừa tạo
    const [newEnterprise] = await db.query(
      'SELECT * FROM period_enterprises WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newEnterprise[0]);
  } catch (error) {
    console.error('Error creating period enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi thêm doanh nghiệp vào đợt' });
  }
});

// PUT /api/period-enterprises/:id - Cập nhật doanh nghiệp trong đợt (Admin only)
router.put('/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, job_description, address, contact_info, max_slots, is_active } = req.body;

    // Kiểm tra doanh nghiệp có tồn tại không
    const [existing] = await db.query(
      'SELECT * FROM period_enterprises WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    // Nếu đổi tên, kiểm tra trùng trong cùng đợt
    if (name && name !== existing[0].name) {
      const [duplicate] = await db.query(
        'SELECT id FROM period_enterprises WHERE period_id = ? AND name = ? AND id != ?',
        [existing[0].period_id, name, id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ error: 'Tên doanh nghiệp này đã tồn tại trong đợt này' });
      }
    }

    await db.query(
      `UPDATE period_enterprises 
       SET name = ?, job_description = ?, address = ?, contact_info = ?, max_slots = ?, is_active = ?
       WHERE id = ?`,
      [
        name || existing[0].name,
        job_description !== undefined ? job_description : existing[0].job_description,
        address !== undefined ? address : existing[0].address,
        contact_info !== undefined ? contact_info : existing[0].contact_info,
        max_slots || 10,
        is_active !== undefined ? is_active : true,
        id
      ]
    );

    // Lấy dữ liệu đã cập nhật
    const [updated] = await db.query(
      'SELECT * FROM period_enterprises WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating period enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật doanh nghiệp trong đợt' });
  }
});

// DELETE /api/period-enterprises/:id - Xóa doanh nghiệp khỏi đợt (Admin only)
router.delete('/:id', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM period_enterprises WHERE id = ?', [id]);
    res.json({ message: 'Xóa doanh nghiệp khỏi đợt thành công' });
  } catch (error) {
    console.error('Error deleting period enterprise:', error);
    res.status(500).json({ error: 'Lỗi khi xóa doanh nghiệp khỏi đợt' });
  }
});

// POST /api/period-enterprises/bulk-delete - Xóa nhiều doanh nghiệp (Admin only)
router.post('/bulk-delete', authGuard, adminGuard, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
    }

    // Kiểm tra tất cả ID là số
    const validIds = ids.filter(id => Number.isInteger(Number(id))).map(id => Number(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'Không có ID hợp lệ' });
    }

    // Check if all enterprises exist
    const placeholders = validIds.map(() => '?').join(',');
    const [existing] = await db.query(
      `SELECT id FROM period_enterprises WHERE id IN (${placeholders})`,
      validIds
    );

    if (existing.length !== validIds.length) {
      return res.status(404).json({ error: 'Một số doanh nghiệp không tồn tại' });
    }

    // Check if any enterprise has students registered
    const [hasStudents] = await db.query(
      `SELECT DISTINCT pe.id 
       FROM period_enterprises pe
       INNER JOIN student_enterprise_preferences sep ON pe.id = sep.period_enterprise_id
       WHERE pe.id IN (${placeholders}) AND sep.status = 'approved'`,
      validIds
    );

    if (hasStudents.length > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa ${hasStudents.length} doanh nghiệp vì đã có sinh viên đăng ký` 
      });
    }

    // Delete enterprises
    await db.query(
      `DELETE FROM period_enterprises WHERE id IN (${placeholders})`,
      validIds
    );

    res.json({ 
      message: `Đã xóa ${validIds.length} doanh nghiệp thành công`,
      deletedCount: validIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting period enterprises:', error);
    res.status(500).json({ error: 'Lỗi khi xóa nhiều doanh nghiệp' });
  }
});


// POST /api/period-enterprises/import - Import doanh nghiệp từ Excel (Admin only)
router.post('/import', authGuard, adminGuard, uploadExcel.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file Excel' });
    }

    const { period_id } = req.body;
    if (!period_id) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'period_id là bắt buộc' });
    }

    // Check if period exists
    const [periods] = await db.query('SELECT id FROM internship_periods WHERE id = ?', [period_id]);
    if (periods.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Đợt đăng ký không tồn tại' });
    }

    // Đọc file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File Excel không có dữ liệu' });
    }

    // Delete uploaded file after reading
    fs.unlinkSync(req.file.path);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Theo dõi trùng lặp trong chính file Excel
    const seenInFile = new Set();

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel starts at row 1 and we have header

      try {
        // Ánh xạ cột Excel sang các trường database
        const name = row['Tên doanh nghiệp'] || row['Tên doanh nghiệp'] || '';
        const job_description = row['Mô tả công việc'] || row['Mô tả công việc'] || null;
        const address = row['Địa chỉ'] || row['Địa chỉ'] || null;
        const contact_info = row['Thông tin liên hệ'] || row['Thông tin liên hệ'] || null;
        const max_slots_raw = row['Số slot tối đa'] || row['Số slot tối đa'] || 10;
        const is_active_str = (row['Đang hoạt động'] || row['Đang hoạt động'] || 'Có').toString().toLowerCase();

        // Validate required fields
        if (!name || name.toString().trim() === '') {
          results.failed++;
          results.errors.push(`Dòng ${rowNum}: Tên doanh nghiệp là bắt buộc`);
          continue;
        }

        const nameTrimmed = name.toString().trim();

        // Kiểm tra độ dài tên (VARCHAR(200))
        if (nameTrimmed.length > 200) {
          results.failed++;
          results.errors.push(`Dòng ${rowNum}: Tên doanh nghiệp không được vượt quá 200 ký tự`);
          continue;
        }

        // Kiểm tra trùng lặp trong file Excel
        const nameKey = nameTrimmed.toLowerCase();
        if (seenInFile.has(nameKey)) {
          results.failed++;
          results.errors.push(`Dòng ${rowNum}: Tên doanh nghiệp "${nameTrimmed}" bị trùng trong file Excel`);
          continue;
        }
        seenInFile.add(nameKey);

        // Check if enterprise already exists in this period
        const [existing] = await db.query(
          'SELECT id FROM period_enterprises WHERE period_id = ? AND name = ?',
          [period_id, nameTrimmed]
        );

        if (existing.length > 0) {
          results.failed++;
          results.errors.push(`Dòng ${rowNum}: Doanh nghiệp "${nameTrimmed}" đã tồn tại trong đợt này`);
          continue;
        }

        // Validate max_slots
        let max_slots = parseInt(max_slots_raw);
        if (isNaN(max_slots) || max_slots < 1) {
          max_slots = 10; // Default value
        }
        if (max_slots > 1000) {
          results.failed++;
          results.errors.push(`Dòng ${rowNum}: Số slot tối đa không được vượt quá 1000`);
          continue;
        }

        // Kiểm tra độ dài địa chỉ (VARCHAR(255))
        let addressTrimmed = null;
        if (address) {
          addressTrimmed = address.toString().trim();
          if (addressTrimmed.length > 255) {
            results.failed++;
            results.errors.push(`Dòng ${rowNum}: Địa chỉ không được vượt quá 255 ký tự`);
            continue;
          }
          if (addressTrimmed === '') {
            addressTrimmed = null;
          }
        }

        // Kiểm tra độ dài thông tin liên hệ (VARCHAR(255))
        let contactInfoTrimmed = null;
        if (contact_info) {
          contactInfoTrimmed = contact_info.toString().trim();
          if (contactInfoTrimmed.length > 255) {
            results.failed++;
            results.errors.push(`Dòng ${rowNum}: Thông tin liên hệ không được vượt quá 255 ký tự`);
            continue;
          }
          // Tùy chọn: Kiểm tra định dạng email nếu trông giống email
          if (contactInfoTrimmed.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactInfoTrimmed)) {
              results.failed++;
              results.errors.push(`Dòng ${rowNum}: Email không hợp lệ: ${contactInfoTrimmed}`);
              continue;
            }
          }
          if (contactInfoTrimmed === '') {
            contactInfoTrimmed = null;
          }
        }

        // Kiểm tra độ dài mô tả công việc (TEXT - không giới hạn nhưng kiểm tra hợp lý)
        let jobDescriptionTrimmed = null;
        if (job_description) {
          jobDescriptionTrimmed = job_description.toString().trim();
          if (jobDescriptionTrimmed.length > 65535) {
            results.failed++;
            results.errors.push(`Dòng ${rowNum}: Mô tả công việc quá dài`);
            continue;
          }
          if (jobDescriptionTrimmed === '') {
            jobDescriptionTrimmed = null;
          }
        }

        // Parse is_active
        const is_active = is_active_str === 'có' || is_active_str === 'co' || is_active_str === 'yes' || is_active_str === 'true' || is_active_str === '1';

        // Insert enterprise
        await db.query(
          `INSERT INTO period_enterprises (period_id, name, job_description, address, contact_info, max_slots, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            period_id,
            nameTrimmed,
            jobDescriptionTrimmed,
            addressTrimmed,
            contactInfoTrimmed,
            max_slots,
            is_active
          ]
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Dòng ${rowNum}: ${error.message || 'Lỗi không xác định'}`);
      }
    }

    res.json({
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      success: results.success,
      failed: results.failed,
      errors: results.errors
    });
  } catch (error) {
    // Clean up file if still exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error importing period enterprises:', error);
    res.status(500).json({ error: 'Lỗi khi import doanh nghiệp từ Excel' });
  }
});

module.exports = router;

