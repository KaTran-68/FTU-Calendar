# FTU2 Calendar

Ứng dụng web giúp sinh viên FTU2 dán (paste) dữ liệu thời khoá biểu lấy từ cổng thông tin sinh viên và tự động tạo toàn bộ lịch học lên Google Calendar cá nhân — mỗi môn một màu, kèm nhắc nhở trước giờ học theo số phút tự chọn.

Đây là dự án frontend-only (React + Vite + TypeScript), không có backend — mọi thao tác với Google Calendar được gọi thẳng từ trình duyệt bằng OAuth (Google Identity Services), không có server nào giữ dữ liệu hay access token của bạn.

## Tính năng

- Dán JSON thời khoá biểu → xem trước số buổi học / số môn đã đọc được.
- Chọn số phút muốn được nhắc trước mỗi buổi học (ví dụ 45 phút).
- Tạo một calendar riêng trên Google Calendar (tên `HK-<mã học kỳ>`, ví dụ `HK-20261`) và đẩy toàn bộ buổi học vào đó — không lẫn với lịch cá nhân.
- Mỗi môn học được gán một màu riêng.
- Chạy lại nhiều lần với cùng dữ liệu không bị tạo trùng sự kiện.

## Cách lấy dữ liệu thời khoá biểu

1. Đăng nhập cổng thông tin sinh viên FTU2, mở trang thời khoá biểu.
2. Mở DevTools (F12) → tab Network, tải lại trang thời khoá biểu.
3. Tìm request trả về JSON thời khoá biểu (dạng `{ "data": { "ds_tiet_trong_ngay": [...], "ds_tuan_tkb": [...] }, ... }`), copy toàn bộ nội dung response.
4. Dán vào ô nhập liệu trên trang FTU2 Calendar.

> Dữ liệu này chỉ được xử lý trong trình duyệt của bạn, không được gửi đi đâu ngoài Google Calendar API.

## Yêu cầu môi trường

- Node.js 20+
- Một Google Cloud OAuth Client ID (xem hướng dẫn bên dưới)

## Cài đặt & chạy local

```bash
npm install
cp .env.example .env
# điền VITE_GOOGLE_CLIENT_ID vào .env
npm run dev
```

## Tạo Google OAuth Client ID

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (hoặc dùng project có sẵn).
2. Vào **APIs & Services → Library**, bật **Google Calendar API**.
3. Vào **APIs & Services → OAuth consent screen**, chọn loại **External**, điền thông tin cơ bản, thêm email của bạn vào danh sách **Test users** (app ở chế độ Testing chỉ đăng nhập được bằng các email này).
4. Vào **APIs & Services → Credentials → Create Credentials → OAuth client ID**, chọn **Web application**.
5. Ở mục **Authorized JavaScript origins**, thêm:
   - `http://localhost:5173` (chạy local với Vite dev server)
   - domain thật nếu bạn deploy lên hosting tĩnh (Vercel/Netlify/GitHub Pages...)
6. Copy **Client ID** vừa tạo vào file `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

## Scripts

```bash
npm run dev        # chạy dev server
npm run build       # build production
npm run preview     # xem thử bản build
npm run lint         # kiểm tra ESLint
npm run typecheck   # kiểm tra kiểu TypeScript
npm test            # chạy unit test (Vitest)
```

## Công nghệ sử dụng

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Axios](https://axios-http.com/) để gọi Google Calendar API
- [React Icons](https://react-icons.github.io/react-icons/)
- [Vitest](https://vitest.dev/) + Testing Library

## Ghi chú riêng tư

- File dữ liệu thời khoá biểu cá nhân (`sample_data.txt` hoặc tương tự) không được commit vào repo — đã thêm vào `.gitignore`.
- Access token của Google chỉ được giữ trong bộ nhớ của trình duyệt (không lưu `localStorage`), mất khi tải lại trang.

---

Made by Ka, for Bống.
