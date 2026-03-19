# Gemini ID Photo Studio Pro 🚀

Ứng dụng tạo ảnh thẻ chuyên nghiệp sử dụng sức mạnh của Google Gemini AI.

## ✨ Tính năng chính
- **Xử lý ảnh thẻ AI**: Tự động thay nền, thay trang phục (Sơ mi, Áo dài, Vest, Quân phục...).
- **Giữ nhân dạng**: Chế độ "Strict Identity" giúp giữ nguyên 100% khuôn mặt gốc.
- **Làm đẹp AI**: Làm mịn da, xóa mụn, làm sáng da tự nhiên.
- **Đăng nhập Google**: Lưu trữ API Key cá nhân đồng bộ qua Firebase.
- **Xuất file chuẩn**: Hỗ trợ kích thước 3x4, 4x6 với độ phân giải 300 DPI.

## 🛠 Hướng dẫn triển khai (GitHub & Vercel)

### Bước 1: Đưa mã nguồn lên GitHub
1. Tạo một Repository mới trên GitHub.
2. Mở terminal tại thư mục dự án và chạy các lệnh:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <URL_REPO_CUA_BAN>
   git push -u origin main
   ```

### Bước 2: Triển khai lên Vercel
1. Truy cập [Vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Nhấn **"Add New"** -> **"Project"**.
3. Chọn Repository bạn vừa tải lên.
4. **Quan trọng (Environment Variables):** Trong phần "Environment Variables", hãy thêm các biến sau (lấy từ file `firebase-applet-config.json` nếu bạn muốn dùng Firebase riêng):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - ... (hoặc đơn giản là để nguyên file config nếu bạn tin tưởng GitHub cá nhân)
5. Nhấn **"Deploy"**.

### Bước 3: Cấu hình Firebase (Nếu dùng Auth)
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Vào phần **Authentication** -> **Settings** -> **Authorized Domains**.
3. Thêm tên miền `.vercel.app` của bạn vào danh sách để cho phép đăng nhập Google.

## 🔑 Lưu ý về API Key
Ứng dụng yêu cầu Gemini API Key. Bạn có thể lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).

---
*Phát triển bởi Gemini AI Studio Builder*
