-- Quick check: Verify backtest tables exist and have data
-- Run this in Supabase SQL Editor to debug

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('backtest_runs', 'backtest_trades');

-- 2. Check backtest_runs data (should see your recent backtest)
SELECT id, created_at, status, symbol, timeframe, total_trades, win_rate, total_pnl
FROM backtest_runs
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('backtest_runs', 'backtest_trades');

-- 4. If tables don't exist, run the migration:
-- Copy and run the entire content of: 
-- supabase/migrations/20260120_create_backtesting_tables.sql
