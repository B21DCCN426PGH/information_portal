# FIT Portal Backend API

Backend API server cho cổng thông tin Khoa Công nghệ Thông tin.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` từ `env.example`:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fit_portal
JWT_SECRET=your_jwt_secret_key
```

## Chạy server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập admin
- `GET /api/auth/verify` - Xác thực token

### Home
- `GET /api/home` - Lấy dữ liệu trang chủ (banners, events, news, stats, etc.)

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan (yêu cầu authentication)

### Majors & Courses
- `GET /api/majors` - Lấy danh sách ngành học
- `GET /api/majors/:id` - Lấy chi tiết ngành học kèm môn học
- `POST /api/majors` - Tạo ngành học mới (yêu cầu authentication)
- `PUT /api/majors/:id` - Cập nhật ngành học (yêu cầu authentication)
- `DELETE /api/majors/:id` - Xóa ngành học (yêu cầu authentication)
- `GET /api/majors/:id/courses` - Lấy danh sách môn học của ngành
- `POST /api/majors/:id/courses` - Thêm môn học (yêu cầu authentication)
- `PUT /api/majors/:id/courses/:courseId` - Cập nhật môn học (yêu cầu authentication)
- `DELETE /api/majors/:id/courses/:courseId` - Xóa môn học (yêu cầu authentication)

### CRUD Resources (tất cả đều có GET, POST, PUT, DELETE)
- `/api/banners` - Quản lý banner
- `/api/news` - Quản lý tin tức
- `/api/events` - Quản lý sự kiện
- `/api/recruitment` - Quản lý tuyển dụng
- `/api/enterprises` - Quản lý doanh nghiệp
- `/api/lecturers` - Quản lý giảng viên
- `/api/research` - Quản lý nghiên cứu
- `/api/student-documents` - Quản lý tài liệu sinh viên
- `/api/admissions` - Quản lý tuyển sinh
- `/api/faculty-info` - Thông tin khoa

### File Upload
- `POST /api/upload/single` - Upload một file (yêu cầu authentication)
- `POST /api/upload/multiple` - Upload nhiều file (yêu cầu authentication)
- `GET /api/upload/:filename` - Lấy file đã upload

## Authentication

Gửi token trong header:
```
Authorization: Bearer <token>
```

## File Upload

Upload file với form-data:
- Field name: `file` (single) hoặc `files` (multiple)
- Max file size: 10MB
- Allowed types: jpeg, jpg, png, gif, pdf, doc, docx

Files được lưu trong thư mục `uploads/` và có thể truy cập qua `/api/upload/:filename`

## Pagination

Một số endpoints hỗ trợ pagination:
```
GET /api/resource?page=1&limit=10&q=search_term
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Handling

Tất cả errors trả về format:
```json
{
  "success": false,
  "message": "Error message",
  "details": "Additional details (in development mode)"
}
```

## Database

Xem file `docs/db_schema.sql` để biết cấu trúc database.

