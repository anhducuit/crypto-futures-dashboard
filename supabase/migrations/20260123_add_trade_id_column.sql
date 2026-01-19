-- Migration: Add trade_id column to trading_history
-- Purpose: Store unique human-readable trade identifiers like BTC-A1B2

ALTER TABLE trading_history ADD COLUMN IF NOT EXISTS trade_id TEXT;

-- Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_trading_history_trade_id ON trading_history(trade_id);
