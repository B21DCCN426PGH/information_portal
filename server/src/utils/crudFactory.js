const express = require('express');
const pool = require('../config/db');

const buildCrudRouter = ({
  tableName,
  idField = 'id',
  searchableFields = [],
  defaultSort = `${idField} DESC`,
  authGuard = null,
  nullableFields = [],
  dateFields = [], // Các field là date/datetime cần format
  uniqueFields = [], // Các field cần kiểm tra tính duy nhất 
}) => {
  const router = express.Router();

  const formatDateFields = (rows) => {
    if (!dateFields.length || !rows || !Array.isArray(rows)) return rows;
    
    return rows.map(row => {
      const formatted = { ...row };
      dateFields.forEach(field => {
        if (formatted[field] !== null && formatted[field] !== undefined) {
          // Nếu đã là string YYYY-MM-DD (từ DATE_FORMAT), giữ nguyên
          if (typeof formatted[field] === 'string' && formatted[field].match(/^\d{4}-\d{2}-\d{2}$/)) {
            return; // Đã đúng format
          }
          
          // Với dateStrings: true, MySQL sẽ trả về string, không phải Date object
          // Nhưng vẫn cần xử lý trường hợp datetime string (YYYY-MM-DD HH:mm:ss) -> YYYY-MM-DD
          if (typeof formatted[field] === 'string') {
            if (formatted[field].includes('T')) {
              // ISO string: lấy phần trước 'T'
              formatted[field] = formatted[field].split('T')[0];
            } else if (formatted[field].includes(' ')) {
              // MySQL datetime: lấy phần trước khoảng trắng
              formatted[field] = formatted[field].split(' ')[0];
            }
          }
        }
      });
      return formatted;
    });
  };

  router.get('/', async (req, res, next) => {
    try {
      const { q, page, limit: limitParam } = req.query;
      
      // Build SELECT clause với DATE_FORMAT cho date fields (giống như students.js)
      // Sử dụng DATE_FORMAT trong query để tránh timezone issues
      let sql;
      if (dateFields.length > 0) {
        // Query tất cả columns, nhưng format date fields bằng DATE_FORMAT
        // Lấy tất cả columns trước
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = columns.map(col => col.Field);
        
        // Build SELECT với DATE_FORMAT cho date fields
        const selectParts = columnNames.map(col => {
          if (dateFields.includes(col)) {
            return `DATE_FORMAT(${col}, "%Y-%m-%d") as ${col}`;
          }
          return col;
        });
        sql = `SELECT ${selectParts.join(', ')} FROM ${tableName}`;
      } else {
        sql = `SELECT * FROM ${tableName}`;
      }
      const params = [];
      
      // Tìm kiếm
      if (q && searchableFields.length) {
        const likeClause = searchableFields.map((field) => `${field} LIKE ?`).join(' OR ');
        sql += ` WHERE ${likeClause}`;
        searchableFields.forEach(() => params.push(`%${q}%`));
      }
      
      // Phân trang
      const limit = limitParam ? parseInt(limitParam) : null;
      const offset = page && limit ? (parseInt(page) - 1) * limit : null;
      
      sql += ` ORDER BY ${defaultSort}`;
      
      if (limit) {
        sql += ` LIMIT ?`;
        params.push(limit);
        if (offset !== null) {
          sql += ` OFFSET ?`;
          params.push(offset);
        }
      }
      
      const [rows] = await pool.query(sql, params);
      // Không cần format nữa vì đã dùng DATE_FORMAT trong query (nếu có dateFields)
      const formattedRows = dateFields.length > 0 ? rows : formatDateFields(rows);
      
      // Lấy tổng số bản ghi cho phân trang
      if (limit) {
        let countSql = `SELECT COUNT(*) AS total FROM ${tableName}`;
        const countParams = [];
        if (q && searchableFields.length) {
          const likeClause = searchableFields.map((field) => `${field} LIKE ?`).join(' OR ');
          countSql += ` WHERE ${likeClause}`;
          searchableFields.forEach(() => countParams.push(`%${q}%`));
        }
        const [countResult] = await pool.query(countSql, countParams);
        const total = countResult[0].total;
        
        return res.json({
          data: formattedRows,
          pagination: {
            page: parseInt(page) || 1,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }
      
      res.json(formattedRows);
    } catch (error) {
      next(error);
    }
  });

  router.get(`/:${idField}`, async (req, res, next) => {
    try {
      const id = req.params[idField];
      // Build SELECT với DATE_FORMAT cho date fields (giống như students.js)
      let sql;
      if (dateFields.length > 0) {
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = columns.map(col => col.Field);
        const selectParts = columnNames.map(col => {
          if (dateFields.includes(col)) {
            return `DATE_FORMAT(${col}, "%Y-%m-%d") as ${col}`;
          }
          return col;
        });
        sql = `SELECT ${selectParts.join(', ')} FROM ${tableName} WHERE ${idField} = ?`;
      } else {
        sql = `SELECT * FROM ${tableName} WHERE ${idField} = ?`;
      }
      const [rows] = await pool.query(sql, [id]);
      if (!rows.length) {
        return res.status(404).json({ message: `${tableName} not found` });
      }
      // Không cần format nữa vì đã dùng DATE_FORMAT trong query
      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  });

  const protect = (middleware) => {
    if (!authGuard) return middleware;
    // Kết hợp authGuard và adminGuard để đảm bảo chỉ admin mới truy cập được
    return (req, res, next) => {
      authGuard(req, res, () => {
        // Kiểm tra role admin
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'super-admin') {
          return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        middleware(req, res, next);
      });
    };
  };

  router.post('/', protect(async (req, res, next) => {
    try {
      const payload = req.body;
      
      // Dọn dẹp payload - loại bỏ giá trị undefined và xử lý boolean
      const cleanPayload = {};
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
          let value = payload[key];
          
          // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
          if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
            // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
            value = value.slice(0, 19).replace('T', ' ');
          }
          
          // Chuyển đổi chuỗi boolean thành boolean thực
          if (value === 'true') {
            cleanPayload[key] = true;
          } else if (value === 'false') {
            cleanPayload[key] = false;
          } else {
            cleanPayload[key] = value;
          }
        }
      });
      
      // Kiểm tra tính duy nhất của các trường uniqueFields
      if (uniqueFields.length > 0) {
        for (const field of uniqueFields) {
          if (cleanPayload[field] !== undefined && cleanPayload[field] !== null && cleanPayload[field] !== '') {
            const [existing] = await pool.query(
              `SELECT ${idField} FROM ${tableName} WHERE ${field} = ?`,
              [cleanPayload[field]]
            );
            if (existing.length > 0) {
              return res.status(409).json({
                message: `${field === 'phone' ? 'Số điện thoại' : field === 'email' ? 'Email' : field} đã tồn tại trong hệ thống`,
                field: field,
              });
            }
          }
        }
      }
      
      const [result] = await pool.query(`INSERT INTO ${tableName} SET ?`, [cleanPayload]);
      // Build SELECT với DATE_FORMAT cho date fields (giống như students.js)
      let sql;
      if (dateFields.length > 0) {
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = columns.map(col => col.Field);
        const selectParts = columnNames.map(col => {
          if (dateFields.includes(col)) {
            return `DATE_FORMAT(${col}, "%Y-%m-%d") as ${col}`;
          }
          return col;
        });
        sql = `SELECT ${selectParts.join(', ')} FROM ${tableName} WHERE ${idField} = ?`;
      } else {
        sql = `SELECT * FROM ${tableName} WHERE ${idField} = ?`;
      }
      const [rows] = await pool.query(sql, [result.insertId]);
      // Không cần format nữa vì đã dùng DATE_FORMAT trong query
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      console.error('Payload:', req.body);
      next(error);
    }
  }));

  router.put(`/:${idField}`, protect(async (req, res, next) => {
    try {
      const id = req.params[idField];
      const payload = req.body;
      
      // Dọn dẹp payload - loại bỏ giá trị undefined và xử lý boolean
      const cleanPayload = {};
      Object.keys(payload).forEach((key) => {
        // Bỏ qua undefined và null (nhưng cho phép chuỗi rỗng cho các trường nullable)
        if (payload[key] === undefined) {
          return;
        }
        
        // Đối với các trường nullable, chuyển đổi chuỗi rỗng thành null
        if (nullableFields.includes(key) && payload[key] === '') {
          cleanPayload[key] = null;
          return;
        }
        
        // Đối với các trường khác, bỏ qua chuỗi rỗng
        if (payload[key] === null || payload[key] === '') {
          return;
        }
        
        let value = payload[key];
        
        // Chuyển đổi chuỗi datetime ISO sang định dạng DATETIME của MySQL
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          // Định dạng ISO: 2025-11-25T18:13:00.000Z -> MySQL: 2025-11-25 18:13:00
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        // Chuyển đổi chuỗi boolean thành boolean thực
        if (value === 'true') {
          cleanPayload[key] = true;
        } else if (value === 'false') {
          cleanPayload[key] = false;
        } else {
          cleanPayload[key] = value;
        }
      });
      
      // Kiểm tra tính duy nhất của các trường uniqueFields (trừ bản ghi hiện tại)
      if (uniqueFields.length > 0) {
        for (const field of uniqueFields) {
          if (cleanPayload[field] !== undefined && cleanPayload[field] !== null && cleanPayload[field] !== '') {
            const [existing] = await pool.query(
              `SELECT ${idField} FROM ${tableName} WHERE ${field} = ? AND ${idField} != ?`,
              [cleanPayload[field], id]
            );
            if (existing.length > 0) {
              return res.status(409).json({
                message: `${field === 'phone' ? 'Số điện thoại' : field === 'email' ? 'Email' : field} đã tồn tại trong hệ thống`,
                field: field,
              });
            }
          }
        }
      }
      
      const [result] = await pool.query(`UPDATE ${tableName} SET ? WHERE ${idField} = ?`, [
        cleanPayload,
        id,
      ]);
      if (!result.affectedRows) {
        return res.status(404).json({ message: `${tableName} not found` });
      }
      // Build SELECT với DATE_FORMAT cho date fields (giống như students.js)
      let sql;
      if (dateFields.length > 0) {
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = columns.map(col => col.Field);
        const selectParts = columnNames.map(col => {
          if (dateFields.includes(col)) {
            return `DATE_FORMAT(${col}, "%Y-%m-%d") as ${col}`;
          }
          return col;
        });
        sql = `SELECT ${selectParts.join(', ')} FROM ${tableName} WHERE ${idField} = ?`;
      } else {
        sql = `SELECT * FROM ${tableName} WHERE ${idField} = ?`;
      }
      const [rows] = await pool.query(sql, [id]);
      // Không cần format nữa vì đã dùng DATE_FORMAT trong query
      res.json(rows[0]);
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      console.error('Payload:', req.body);
      next(error);
    }
  }));

  router.delete(`/:${idField}`, protect(async (req, res, next) => {
    try {
      const id = req.params[idField];
      const [result] = await pool.query(`DELETE FROM ${tableName} WHERE ${idField} = ?`, [id]);
      if (!result.affectedRows) {
        return res.status(404).json({ message: `${tableName} not found` });
      }
      res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      // Kiểm tra lỗi foreign key constraint
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(400).json({ 
          message: `Không thể xóa ${tableName} này vì đang được sử dụng ở nơi khác trong hệ thống.` 
        });
      }
      next(error);
    }
  }));

  return router;
};

module.exports = buildCrudRouter;

