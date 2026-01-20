# Hướng dẫn Deploy Backtesting Framework

## Vấn đề
Lỗi "Failed to send a request to the Edge Function" xảy ra vì Edge Function `backtest` chưa được deploy lên Supabase.

## Giải pháp

### Bước 1: Cài đặt Supabase CLI (nếu chưa có)

```bash
npm install -g supabase
```

Sau đó login:
```bash
supabase login
```

### Bước 2: Link project với Supabase

```bash
supabase link --project-ref <your-project-ref>
```

Bạn có thể tìm project-ref trong Supabase Dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`

### Bước 3: Deploy Database Migration

```bash
supabase db push
```

Lệnh này sẽ tạo 2 tables mới:
- `backtest_runs`
- `backtest_trades`

### Bước 4: Deploy Edge Function

```bash
supabase functions deploy backtest --no-verify-jwt
```

Flag `--no-verify-jwt` cho phép function chạy mà không cần JWT authentication.

### Bước 5: Kiểm tra deployment

```bash
supabase functions list
```

Bạn sẽ thấy function `backtest` trong danh sách.

## Alternative: Deploy qua Supabase Dashboard

Nếu không muốn dùng CLI, bạn có thể:

1. **Deploy Migration**:
   - Vào Supabase Dashboard → SQL Editor
   - Copy nội dung file `supabase/migrations/20260120_create_backtesting_tables.sql`
   - Paste và Run

2. **Deploy Edge Function**:
   - Vào Supabase Dashboard → Edge Functions
   - Click "New Function"
   - Tên: `backtest`
   - Copy code từ `supabase/functions/backtest/index.ts`
   - Deploy

## Kiểm tra hoạt động

Sau khi deploy, thử chạy backtest lại trong UI. Nếu thành công, bạn sẽ thấy status "RUNNING" → "COMPLETED".

## Troubleshooting

**Lỗi: "Too many backtests running"**
- Đợi các backtest hiện tại hoàn thành (max 3 concurrent)

**Lỗi: "Backtest timeout exceeded"**
- Giảm date range (ví dụ: từ 15 ngày xuống 7 ngày)
- Hoặc chọn timeframe lớn hơn (ví dụ: 1h thay vì 1m)

**Lỗi: "Failed to fetch data from Binance"**
- Kiểm tra kết nối internet
- Binance API có thể bị rate limit, thử lại sau vài phút
