
# Hướng dẫn đưa App lên GitHub & Vercel (Cập nhật)

### CÁCH 1: Đồng bộ tự động (Nếu nút Sync hoạt động)
1. Bấm nút Sync GitHub trong trình soạn thảo.
2. Cấp quyền cho GitHub.
3. Chọn Repository để đẩy code lên.

### CÁCH 2: Upload thủ công (Nếu nút Sync báo lỗi đăng nhập)
1. **Tải xuống:** Chọn tính năng "Download Project" hoặc copy toàn bộ code ra thư mục trên máy tính.
2. **GitHub:** Truy cập [github.com/new](https://github.com/new), tạo Repo mới tên là `id-photo-ai`.
3. **Upload:** 
   - Chọn "uploading an existing file".
   - Kéo toàn bộ file trong thư mục vào (trừ thư mục `node_modules` nếu có).
   - Bấm "Commit changes".

### Bước 2: Triển khai lên Vercel
1. Truy cập [Vercel.com](https://vercel.com).
2. Kết nối GitHub và chọn Repo vừa tạo.
3. **Thiết lập API Key:**
   - Tại mục **Environment Variables**, thêm:
     - Key: `API_KEY`
     - Value: (Mã Gemini API của bạn)
4. Bấm **Deploy**.

### Bước 3: Cấu hình Android Studio
1. Copy link Vercel (ví dụ: `https://id-photo-ai.vercel.app`).
2. Mở `MainActivity.kt` trong Android Studio.
3. Dán link vào dòng: `webView.loadUrl("LINK_CUA_BAN_TAI_DAY")`.
