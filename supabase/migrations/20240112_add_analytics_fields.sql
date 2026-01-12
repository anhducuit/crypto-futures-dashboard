-- Add pnl_reason column for manual/automated win/loss explanation
alter table trading_history add column if not exists pnl_reason text;

-- Add strategy_name if it doesn't exist for 1m Scalping vs Safe Mode
alter table trading_history add column if not exists strategy_name text;
