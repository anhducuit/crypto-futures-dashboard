-- Migration: Create Backtesting Framework Tables
-- Created: 2026-01-20
-- Purpose: Support backtesting functionality for trading strategies

-- Table: backtest_runs
-- Stores metadata and results for each backtest execution
CREATE TABLE IF NOT EXISTS backtest_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Configuration
    strategy_name TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    symbol TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    initial_capital DECIMAL(20, 2) DEFAULT 10000,
    risk_percentage DECIMAL(5, 2) DEFAULT 2.0,
    leverage INT DEFAULT 20,
    
    -- Results
    status TEXT DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    win_rate DECIMAL(5, 2),
    profit_factor DECIMAL(10, 2),
    max_drawdown DECIMAL(10, 2),
    sharpe_ratio DECIMAL(10, 4),
    total_pnl DECIMAL(20, 2),
    final_capital DECIMAL(20, 2),
    
    -- Performance
    execution_time_ms INT,
    candles_processed INT,
    error_message TEXT,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: backtest_trades
-- Stores individual trade details for each backtest run
CREATE TABLE IF NOT EXISTS backtest_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backtest_run_id UUID REFERENCES backtest_runs(id) ON DELETE CASCADE,
    
    -- Trade details
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    signal TEXT NOT NULL, -- LONG/SHORT
    entry_price DECIMAL(20, 8) NOT NULL,
    exit_price DECIMAL(20, 8),
    quantity DECIMAL(20, 8) NOT NULL,
    
    -- Results
    pnl DECIMAL(20, 2),
    pnl_percent DECIMAL(10, 4),
    exit_reason TEXT, -- TARGET_HIT, STOP_LOSS, TIMEOUT
    
    -- Indicators at entry
    rsi DECIMAL(5, 2),
    volume_ratio DECIMAL(10, 2),
    ema_fast DECIMAL(20, 8),
    ema_slow DECIMAL(20, 8),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backtest_runs_user_created 
    ON backtest_runs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_strategy 
    ON backtest_runs(strategy_name, timeframe, symbol);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_status 
    ON backtest_runs(status) WHERE status IN ('PENDING', 'RUNNING');

CREATE INDEX IF NOT EXISTS idx_backtest_trades_run_id 
    ON backtest_trades(backtest_run_id);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_entry_time 
    ON backtest_trades(backtest_run_id, entry_time);

-- Enable Row Level Security
ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backtest_runs
CREATE POLICY "Users can view their own backtest runs"
    ON backtest_runs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backtest runs"
    ON backtest_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest runs"
    ON backtest_runs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtest runs"
    ON backtest_runs FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for backtest_trades
CREATE POLICY "Users can view trades from their backtest runs"
    ON backtest_trades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM backtest_runs
            WHERE backtest_runs.id = backtest_trades.backtest_run_id
            AND backtest_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all backtest trades"
    ON backtest_trades FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backtest_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER backtest_runs_updated_at
    BEFORE UPDATE ON backtest_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_backtest_runs_updated_at();

-- Function to calculate backtest metrics
CREATE OR REPLACE FUNCTION calculate_backtest_metrics(run_id UUID)
RETURNS void AS $$
DECLARE
    v_total_trades INT;
    v_winning_trades INT;
    v_losing_trades INT;
    v_win_rate DECIMAL(5, 2);
    v_total_pnl DECIMAL(20, 2);
    v_initial_capital DECIMAL(20, 2);
BEGIN
    -- Get initial capital
    SELECT initial_capital INTO v_initial_capital
    FROM backtest_runs WHERE id = run_id;
    
    -- Calculate metrics
    SELECT 
        COUNT(*),
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END),
        SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END),
        SUM(pnl)
    INTO v_total_trades, v_winning_trades, v_losing_trades, v_total_pnl
    FROM backtest_trades
    WHERE backtest_run_id = run_id;
    
    -- Calculate win rate
    IF v_total_trades > 0 THEN
        v_win_rate := (v_winning_trades::DECIMAL / v_total_trades) * 100;
    ELSE
        v_win_rate := 0;
    END IF;
    
    -- Update backtest_runs
    UPDATE backtest_runs
    SET 
        total_trades = v_total_trades,
        winning_trades = v_winning_trades,
        losing_trades = v_losing_trades,
        win_rate = v_win_rate,
        total_pnl = v_total_pnl,
        final_capital = v_initial_capital + COALESCE(v_total_pnl, 0)
    WHERE id = run_id;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables
COMMENT ON TABLE backtest_runs IS 'Stores backtesting run configurations and results';
COMMENT ON TABLE backtest_trades IS 'Stores individual trades executed during backtesting';
