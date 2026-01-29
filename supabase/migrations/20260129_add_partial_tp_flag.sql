
-- Migration: Add is_partial_tp_hit to trading_history
ALTER TABLE trading_history ADD COLUMN IF NOT EXISTS is_partial_tp_hit BOOLEAN DEFAULT FALSE;

-- Add a comment to the column
COMMENT ON COLUMN trading_history.is_partial_tp_hit IS 'Marks if the trade has reached 50% of the target profit distance for break-even protection.';
