# Hướng dẫn Kiểm tra Edge Function Logs

## Vấn đề
Sau khi deploy Edge Function với bộ lọc đã nới lỏng, vẫn chưa có tín hiệu mới sau 3 phút.

## Các bước kiểm tra

### Bước 1: Xem Edge Function Logs

1. Vào **Supabase Dashboard**
2. Click **Edge Functions** (menu bên trái)
3. Click vào function **check-trades**
4. Click tab **Logs**

### Bước 2: Phân tích Logs

**Tìm kiếm các dòng log sau:**

✅ **Logs tốt (bot đang chạy):**
- `BOT SCAN START - Action: none - Method: POST`
- `Updating heartbeat`
- `shutdown (time: 32ms)`

❌ **Logs lỗi (cần sửa):**
- `Error:` (bất kỳ error nào)
- `Failed to...`
- Không có logs mới trong 5 phút

### Bước 3: Kiểm tra thời gian logs

- **Logs gần nhất** phải trong vòng **1-2 phút** (vì cron chạy mỗi phút)
- Nếu logs cũ hơn 5 phút → Cron job không trigger function

### Bước 4: Nếu không có logs mới

**Nguyên nhân có thể:**
1. **Function chưa được deploy đúng** - Code cũ vẫn đang chạy
2. **Cron job bị tắt** - Kiểm tra lại cron.job
3. **Function bị lỗi ngay từ đầu** - Xem error logs

**Giải pháp:**

#### Nếu function chưa deploy đúng:
- Deploy lại, đảm bảo click **Deploy** sau khi paste code
- Đợi vài giây để Supabase build xong

#### Nếu cron job bị tắt:
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'check-trades-every-minute';

-- Nếu active = false, enable lại:
UPDATE cron.job 
SET active = true 
WHERE jobname = 'check-trades-every-minute';
```

#### Nếu function bị lỗi:
- Xem error message trong logs
- Có thể do syntax error khi paste code
- Thử deploy lại

### Bước 5: Test thủ công

Nếu cron không chạy, bạn có thể **trigger function thủ công**:

1. Vào Edge Functions → check-trades
2. Click **Test** (hoặc **Invoke**)
3. Method: POST
4. Body: `{}`
5. Click **Send**

Xem response và logs để biết function có chạy được không.

## Kết quả mong đợi

Sau khi kiểm tra logs, bạn sẽ thấy:
- ✅ Logs mới mỗi phút
- ✅ "BOT SCAN START"
- ✅ Không có error

Nếu thấy điều này → Bot đang chạy, chỉ là chưa có tín hiệu phù hợp (thị trường yên tĩnh).

Nếu KHÔNG thấy → Có vấn đề cần fix.

---

**Hãy cho tôi biết:**
1. Logs gần nhất là khi nào?
2. Có error gì không?
3. Có thấy "BOT SCAN START" không?
