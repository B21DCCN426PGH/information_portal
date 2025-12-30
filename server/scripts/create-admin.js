/**
 * Script tiện ích để tạo tài khoản admin từ command line
 * 
 * Cách sử dụng:
 * node scripts/create-admin.js <name> <email> <password> [role]
 * 
 * Ví dụ:
 * node scripts/create-admin.js "Admin User" admin@example.com password123 admin
 * node scripts/create-admin.js "Super Admin" super@example.com password123 super-admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Cách sử dụng: node scripts/create-admin.js <name> <email> <password> [role]');
  console.error('Ví dụ: node scripts/create-admin.js "Admin User" admin@example.com password123 admin');
  process.exit(1);
}

const [name, email, password, role = 'admin'] = args;

if (!['admin', 'super-admin'].includes(role)) {
  console.error('Role phải là "admin" hoặc "super-admin"');
  process.exit(1);
}

async function createAdmin() {
  let connection;
  try {
    // Kết nối database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fit_portal',
    });

    // Kiểm tra email đã tồn tại chưa
    const [existing] = await connection.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error(`❌ Email "${email}" đã tồn tại!`);
      process.exit(1);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo admin
    const [result] = await connection.query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );

    console.log('✅ Tạo tài khoản admin thành công!');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Tên: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();

