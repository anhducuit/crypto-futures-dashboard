
-- Add telegram_message_id to trading_history table
ALTER TABLE trading_history 
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
