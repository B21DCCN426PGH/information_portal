# Hướng dẫn cấu hình Google Gemini API

## Vấn đề hiện tại

1. **API Key bị leak**: API key hiện tại đã bị Google báo là leaked và không thể sử dụng được nữa.
2. **API Key hardcode**: API key đang bị hardcode trong code, cần di chuyển vào biến môi trường để bảo mật.

## Cách khắc phục

### Bước 1: Tạo API Key mới

1. Truy cập: https://aistudio.google.com/apikey
2. Đăng nhập bằng tài khoản Google của bạn
3. Click **"Create API Key"** hoặc **"Get API Key"**
4. Chọn project hoặc tạo project mới
5. Copy API key mới (bắt đầu bằng `AIza...`)

### Bước 2: Cấu hình API Key

1. Tạo file `.env` trong thư mục `backend/`:

```bash
cd backend
copy .env.example .env
```

2. Mở file `.env` và thêm API key mới:

```env
GEMINI_API_KEY=AIzaSy...your_new_api_key_here
```

**QUAN TRỌNG**: 
- ❌ **KHÔNG** commit file `.env` lên Git
- ✅ File `.env` đã được thêm vào `.gitignore`
- ✅ Chỉ sử dụng `.env.example` để làm mẫu

### Bước 3: Cài đặt package mới

```bash
cd backend
pip install -r requirements.txt
```

Hoặc cài đặt riêng:

```bash
pip uninstall google-generativeai
pip install google-genai python-dotenv
```

### Bước 4: Kiểm tra

Chạy lại server:

```bash
python app.py
```

Nếu không còn warning và lỗi 403, bạn đã cấu hình thành công!

## Lưu ý bảo mật

1. **KHÔNG** hardcode API key trong code
2. **KHÔNG** commit file `.env` lên Git
3. **KHÔNG** chia sẻ API key công khai
4. Nếu API key bị leak, hãy tạo key mới ngay lập tức

## Troubleshooting

### Lỗi: "GEMINI_API_KEY không được tìm thấy"
- Kiểm tra file `.env` có tồn tại trong thư mục `backend/`
- Kiểm tra tên biến có đúng là `GEMINI_API_KEY`
- Đảm bảo đã cài `python-dotenv` và gọi `load_dotenv()`

### Lỗi: "403 Your API key was reported as leaked"
- API key cũ đã bị vô hiệu hóa
- Cần tạo API key mới từ https://aistudio.google.com/apikey

### Lỗi: "ModuleNotFoundError: No module named 'google.generativeai'"
- Chạy: `pip install google-generativeai`

