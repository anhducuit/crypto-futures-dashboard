-- Nới lỏng bộ lọc để bot tạo nhiều tín hiệu hơn
-- Chạy trong Supabase SQL Editor

-- 1. Giảm yêu cầu volume ratio (từ 1.2 xuống 1.1)
UPDATE bot_settings 
SET value = '1.1' 
WHERE key = 'min_volume_ratio';

-- 2. Tăng khoảng cách cho phép từ EMA (từ 0.015 lên 0.025)
UPDATE bot_settings 
SET value = '0.025' 
WHERE key = 'max_dist_from_ema';

-- 3. Nới lỏng RSI range cho 1m scalping
-- (Sẽ cần update trong code, nhưng tạm thời có thể test với settings hiện tại)

-- 4. Verify changes
SELECT key, value, updated_at 
FROM bot_settings 
WHERE key IN ('min_volume_ratio', 'max_dist_from_ema')
ORDER BY key;
