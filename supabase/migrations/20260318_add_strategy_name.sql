-- Migration: Add strategy_name column to trading_history
-- Purpose: Store the name of the 6-Combo strategy that triggered the trade (e.g., Combo 2: CHIẾN THẦN ĐU TREND)

ALTER TABLE trading_history ADD COLUMN IF NOT EXISTS strategy_name TEXT;

-- Update existing records if needed (optional)
-- UPDATE trading_history SET strategy_name = 'Legacy' WHERE strategy_name IS NULL;
