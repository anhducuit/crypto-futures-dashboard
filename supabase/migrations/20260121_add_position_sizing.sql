-- Migration: Add Position Sizing columns to trading_history
-- Created: 2026-01-20
-- Purpose: Support position sizing and risk management

-- Add position sizing columns
ALTER TABLE trading_history
ADD COLUMN IF NOT EXISTS recommended_quantity DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS notional_value DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS required_margin DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS max_loss_usd DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS account_balance_at_signal DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS risk_percentage_used DECIMAL(5, 2);

-- Add bot settings for position sizing defaults
INSERT INTO bot_settings (key, value) VALUES
('account_balance', '10000'),
('risk_percentage', '2'),
('leverage', '20')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add comments for documentation
COMMENT ON COLUMN trading_history.recommended_quantity IS 'Số lượng coin đề xuất dựa trên risk management';
COMMENT ON COLUMN trading_history.notional_value IS 'Giá trị danh nghĩa của position (Futures)';
COMMENT ON COLUMN trading_history.required_margin IS 'Margin cần thiết để mở lệnh';
COMMENT ON COLUMN trading_history.max_loss_usd IS 'Lỗ tối đa nếu hit SL (USD)';
COMMENT ON COLUMN trading_history.account_balance_at_signal IS 'Account balance tại thời điểm tạo signal';
COMMENT ON COLUMN trading_history.risk_percentage_used IS 'Risk percentage được sử dụng';
