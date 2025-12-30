const express = require('express');
const pool = require('../config/db');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const uploadExcel = require('../middleware/uploadExcel');
const XLSX = require('xlsx');
const fs = require('fs');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM majors ORDER BY sort_order ASC, name ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[major]] = await pool.query('SELECT * FROM majors WHERE id = ?', [id]);
    if (!major) {
      return res.status(404).json({ message: 'Major not found' });
    }
    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE major_id = ? ORDER BY semester ASC, category ASC',
      [id]
    );
    major.courses = courses;
    res.json(major);
  } catch (error) {
    next(error);
  }
});

router.post('/', authGuard, adminGuard, async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Dọn dẹp payload - xóa các trường tự quản lý và chuyển đổi datetime
    const cleanPayload = {};
    Object.keys(payload).forEach((key) => {
      // Bỏ qua các trường timestamp tự quản lý
      if (key === 'created_at' || key === 'updated_at') {
        return;
      }
      
      if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        let value = payload[key];
        
        // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        cleanPayload[key] = value;
      }
    });
    
    const [result] = await pool.query('INSERT INTO majors SET ?', [cleanPayload]);
    const [[major]] = await pool.query('SELECT * FROM majors WHERE id = ?', [result.insertId]);
    res.status(201).json(major);
  } catch (error) {
    console.error('Error inserting major:', error);
    console.error('Payload:', req.body);
    next(error);
  }
});

router.put('/:id', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    
    // Dọn dẹp payload - xóa các trường tự quản lý và chuyển đổi datetime
    const cleanPayload = {};
    Object.keys(payload).forEach((key) => {
      // Bỏ qua các trường timestamp tự quản lý
      if (key === 'created_at' || key === 'updated_at') {
        return;
      }
      
      if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        let value = payload[key];
        
        // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        cleanPayload[key] = value;
      }
    });
    
    const [result] = await pool.query('UPDATE majors SET ? WHERE id = ?', [cleanPayload, id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Major not found' });
    }
    const [[major]] = await pool.query('SELECT * FROM majors WHERE id = ?', [id]);
    res.json(major);
  } catch (error) {
    console.error('Error updating major:', error);
    console.error('Payload:', req.body);
    next(error);
  }
});

router.delete('/:id', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem có sinh viên nào đang thuộc ngành này không
    const [students] = await pool.query('SELECT COUNT(*) as count FROM students WHERE major_id = ?', [id]);
    const studentCount = students[0]?.count || 0;
    
    if (studentCount > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa ngành học này',
        message: `Hiện có ${studentCount} sinh viên đang thuộc ngành này. Vui lòng chuyển sinh viên sang ngành khác trước khi xóa.`,
        studentCount: studentCount
      });
    }
    
    // Kiểm tra số lượng môn học thuộc ngành này
    const [courses] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE major_id = ?', [id]);
    const courseCount = courses[0]?.count || 0;
    
    // Xóa các môn học thuộc ngành này
    if (courseCount > 0) {
    await pool.query('DELETE FROM courses WHERE major_id = ?', [id]);
    }
    
    // Xóa ngành học
    const [result] = await pool.query('DELETE FROM majors WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Major not found' });
    }
    
    // Trả về thông tin về số lượng môn học đã xóa
    res.json({ 
      message: 'Ngành học đã được xóa thành công',
      deletedCourses: courseCount
    });
  } catch (error) {
    // Xử lý lỗi foreign key constraint nếu có
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === '23000') {
      return res.status(400).json({ 
        error: 'Không thể xóa ngành học này',
        message: 'Ngành học này đang được sử dụng bởi sinh viên hoặc các bản ghi khác trong hệ thống.'
      });
    }
    next(error);
  }
});

router.get('/:id/courses', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE major_id = ? ORDER BY semester ASC, category ASC',
      [id]
    );
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/courses', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body, major_id: id };
    
    // Dọn dẹp payload - xóa các trường tự quản lý và chuyển đổi datetime
    const cleanPayload = {};
    Object.keys(payload).forEach((key) => {
      // Bỏ qua các trường timestamp tự quản lý
      if (key === 'created_at' || key === 'updated_at') {
        return;
      }
      
      if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        let value = payload[key];
        
        // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        cleanPayload[key] = value;
      }
    });
    
    const [result] = await pool.query('INSERT INTO courses SET ?', [cleanPayload]);
    const [[course]] = await pool.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
    res.status(201).json(course);
  } catch (error) {
    console.error('Error inserting course:', error);
    console.error('Payload:', req.body);
    next(error);
  }
});

router.put('/:id/courses/:courseId', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id, courseId } = req.params;
    const payload = { ...req.body, major_id: id };
    
    // Dọn dẹp payload - xóa các trường tự quản lý và chuyển đổi datetime
    const cleanPayload = {};
    Object.keys(payload).forEach((key) => {
      // Bỏ qua các trường timestamp tự quản lý
      if (key === 'created_at' || key === 'updated_at') {
        return;
      }
      
      if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        let value = payload[key];
        
        // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        cleanPayload[key] = value;
      }
    });
    
    const [result] = await pool.query('UPDATE courses SET ? WHERE id = ? AND major_id = ?', [
      cleanPayload,
      courseId,
      id,
    ]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const [[course]] = await pool.query('SELECT * FROM courses WHERE id = ?', [courseId]);
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    console.error('Payload:', req.body);
    next(error);
  }
});

router.delete('/:id/courses/:courseId', authGuard, adminGuard, async (req, res, next) => {
  try {
    const { id, courseId } = req.params;
    const [result] = await pool.query('DELETE FROM courses WHERE id = ? AND major_id = ?', [
      courseId,
      id,
    ]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/majors/:id/courses/template - Download Excel template (phải đặt trước các routes khác)
router.get('/:id/courses/template', authGuard, adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra major tồn tại
    const [[major]] = await pool.query('SELECT id, name FROM majors WHERE id = ?', [id]);
    if (!major) {
      return res.status(404).json({ error: 'Ngành học không tồn tại' });
    }

    const templateData = [
      {
        'Mã môn học': 'CS101',
        'Tên môn học': 'Lập trình cơ bản',
        'Danh mục': 'General Education',
        'Học kỳ': 1,
        'Tín chỉ': 3,
        'Mô tả': 'Môn học giới thiệu về lập trình cơ bản'
      },
      {
        'Mã môn học': 'CS102',
        'Tên môn học': 'Cấu trúc dữ liệu và giải thuật',
        'Danh mục': 'Foundation',
        'Học kỳ': 2,
        'Tín chỉ': 4,
        'Mô tả': 'Môn học về cấu trúc dữ liệu và giải thuật cơ bản'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Môn học');

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 15 }, // Mã môn học
      { wch: 35 }, // Tên môn học
      { wch: 20 }, // Danh mục
      { wch: 10 }, // Học kỳ
      { wch: 10 }, // Tín chỉ
      { wch: 50 }  // Mô tả
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_mon_hoc.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Lỗi khi tạo template Excel' });
  }
});

// POST /api/majors/:id/courses/import - Import môn học từ Excel
router.post('/:id/courses/import', authGuard, adminGuard, uploadExcel.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file Excel' });
    }

    // Kiểm tra major tồn tại
    const [[major]] = await pool.query('SELECT id, name FROM majors WHERE id = ?', [id]);
    if (!major) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ngành học không tồn tại' });
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

    // Xóa file sau khi đọc
    fs.unlinkSync(req.file.path);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Map danh mục từ tiếng Việt sang tiếng Anh
    const categoryMap = {
      'Bắt buộc chung': 'General Education',
      'Cơ sở ngành': 'Foundation',
      'Chuyên ngành': 'Major',
      'Bắt buộc chuyên ngành': 'Elective',
      'Thực tập': 'Internship',
      'Luận văn tốt nghiệp': 'Thesis',
      'Giáo dục chuyên nghiệp': 'Professional Education'
    };

    // Theo dõi trùng lặp trong file Excel
    const seenInFile = new Set();

    // Xử lý từng dòng
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 vì Excel bắt đầu từ dòng 1 và có header

      try {
        // Ánh xạ cột Excel sang các trường database
        const code = String(row['Mã môn học'] || '').trim();
        const name = String(row['Tên môn học'] || '').trim();
        let category = String(row['Danh mục'] || '').trim();
        const semester = parseInt(row['Học kỳ'] || 1);
        const credits = parseInt(row['Tín chỉ'] || 0);
        const description = String(row['Mô tả'] || '').trim();

        // Kiểm tra dữ liệu bắt buộc
        if (!code) {
          results.errors.push(`Dòng ${rowNum}: Thiếu mã môn học`);
          results.failed++;
          continue;
        }

        if (!name) {
          results.errors.push(`Dòng ${rowNum}: Thiếu tên môn học`);
          results.failed++;
          continue;
        }

        // Chuyển đổi danh mục nếu cần (case-insensitive và trim)
        const categoryNormalized = category.trim();
        let mappedCategory = null;
        
        // Thử tìm exact match trước
        if (categoryMap[categoryNormalized]) {
          mappedCategory = categoryMap[categoryNormalized];
        } else {
          // Thử tìm với case-insensitive
          const categoryLower = categoryNormalized.toLowerCase();
          const foundKey = Object.keys(categoryMap).find(key => key.toLowerCase() === categoryLower);
          if (foundKey) {
            mappedCategory = categoryMap[foundKey];
          } else {
            // Nếu không tìm thấy trong map, có thể đã là tiếng Anh rồi
            // Kiểm tra xem có phải là valid category không
            const validCategories = ['General Education', 'Foundation', 'Major', 'Elective', 'Internship', 'Thesis', 'Professional Education'];
            if (validCategories.includes(categoryNormalized)) {
              mappedCategory = categoryNormalized;
            }
          }
        }

        // Validate category
        const validCategories = ['General Education', 'Foundation', 'Major', 'Elective', 'Internship', 'Thesis', 'Professional Education'];
        if (!mappedCategory || !validCategories.includes(mappedCategory)) {
          const originalCategory = row['Danh mục'] || categoryNormalized;
          results.errors.push(`Dòng ${rowNum}: Danh mục "${originalCategory}" không hợp lệ. Sử dụng tiếng Việt: ${Object.keys(categoryMap).join(', ')} hoặc tiếng Anh: ${validCategories.join(', ')}`);
          results.failed++;
          continue;
        }
        
        category = mappedCategory;

        // Validate semester
        if (isNaN(semester) || semester < 1 || semester > 16) {
          results.errors.push(`Dòng ${rowNum}: Học kỳ phải là số từ 1 đến 16`);
          results.failed++;
          continue;
        }

        // Validate credits
        if (isNaN(credits) || credits < 1 || credits > 10) {
          results.errors.push(`Dòng ${rowNum}: Tín chỉ phải là số từ 1 đến 10`);
          results.failed++;
          continue;
        }

        // Kiểm tra trùng lặp trong file Excel
        const rowKey = `${code}_${name}`;
        if (seenInFile.has(rowKey)) {
          results.errors.push(`Dòng ${rowNum}: Mã môn học "${code}" và tên "${name}" bị trùng trong file Excel`);
          results.failed++;
          continue;
        }
        seenInFile.add(rowKey);

        // Kiểm tra trùng lặp trong database
        const [existing] = await pool.query(
          'SELECT id FROM courses WHERE major_id = ? AND code = ?',
          [id, code]
        );

        if (existing.length > 0) {
          results.errors.push(`Dòng ${rowNum}: Mã môn học "${code}" đã tồn tại trong ngành học này`);
          results.failed++;
          continue;
        }

        // Thêm môn học vào database
        await pool.query(
          'INSERT INTO courses (major_id, code, name, category, semester, credits, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, code, name, category, semester, credits, description || null]
        );

        results.success++;
      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        results.errors.push(`Dòng ${rowNum}: ${error.message || 'Lỗi không xác định'}`);
        results.failed++;
      }
    }

    res.json({
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      ...results
    });
  } catch (error) {
    console.error('Error importing courses:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Lỗi khi import môn học từ Excel' });
  }
});

module.exports = router;

