# Hướng dẫn Deploy Robot (check-trades)

Để các thay đổi về **Stop Loss nới rộng** và **Lưu SL Gốc** có hiệu lực, anh cần deploy mã nguồn mới lên Supabase.

### Cách thực hiện (Dùng Terminal/PowerShell)

1. **Mở PowerShell** hoặc CMD tại thư mục gốc của dự án (`d:\CODE\trading`).
2. **Đăng nhập** (nếu chưa làm):
   ```powershell
   npx supabase login
   ```
3. **Deploy Function**:
   Chạy lệnh duy nhất này để cập nhật Robot:
   ```powershell
   npx supabase functions deploy check-trades
   ```

*(Lưu ý: Dùng `npx` sẽ giúp anh chạy lệnh mà không cần cài đặt Supabase CLI lên toàn hệ thống)*

---

### Lưu ý
- Nếu anh gặp lỗi "Command not found", hãy cài đặt Supabase CLI bằng lệnh: `npm install -g supabase`.
- Sau khi chạy lệnh deploy thành công thành công, Robot sẽ tự động áp dụng logic mới cho **tất cả các tín hiệu nổ ra từ sau thời điểm đó**.

Anh có thể kiểm tra trạng thái Robot tại: 
`Supabase Dashboard -> Edge Functions -> check-trades`
