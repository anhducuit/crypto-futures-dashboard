-- Migration: Create Price Action Signals table
-- Created: 2026-01-21
-- Purpose: Store Price Action bot signals (Bot #3)

-- Main signals table
CREATE TABLE IF NOT EXISTS price_action_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Basic Info
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'LONG' | 'SHORT'
    
    -- Pattern Classification
    pattern_category TEXT NOT NULL, -- 'BREAKOUT', 'REVERSAL', 'CONTINUATION', 'STRATEGY'
    pattern_type TEXT NOT NULL, -- 'TRIANGLE_BREAKOUT', 'PIN_BAR', 'SNIPER_ENTRY', etc.
    pattern_strength TEXT, -- 'WEAK', 'MEDIUM', 'STRONG', 'EXTREME'
    
    -- Price Levels
    entry_price DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    target_price DECIMAL(20, 8),
    risk_reward_ratio DECIMAL(10, 2),
    
    -- Market Structure
    market_trend TEXT, -- 'BULLISH', 'BEARISH', 'SIDEWAYS'
    last_bos_type TEXT, -- 'BULLISH_BOS', 'BEARISH_BOS'
    last_bos_price DECIMAL(20, 8),
    
    -- Supply/Demand Zone (if applicable)
    sd_zone_type TEXT, -- 'SUPPLY', 'DEMAND'
    sd_zone_top DECIMAL(20, 8),
    sd_zone_bottom DECIMAL(20, 8),
    sd_zone_strength TEXT, -- 'WEAK', 'MEDIUM', 'STRONG', 'EXTREME'
    
    -- Confluence
    confluence_factors TEXT[], -- Array of factors
    confluence_score INT, -- 0-100
    
    -- Pattern Data (flexible JSON)
    pattern_data JSONB,
    
    -- Confirmations
    volume_confirmed BOOLEAN DEFAULT FALSE,
    volume_ratio DECIMAL(10, 2),
    multi_timeframe_confirmed BOOLEAN DEFAULT FALSE,
    fibonacci_confluence BOOLEAN DEFAULT FALSE,
    
    -- Status Tracking
    status TEXT DEFAULT 'PENDING', -- PENDING, ACTIVE, WIN, LOSS, CANCELLED
    entry_filled_at TIMESTAMPTZ,
    exit_price DECIMAL(20, 8),
    exit_at TIMESTAMPTZ,
    pnl_percent DECIMAL(10, 4),
    
    -- Telegram
    telegram_message_id BIGINT,
    telegram_chart_image TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pa_signals_symbol_tf ON price_action_signals(symbol, timeframe, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pa_signals_pattern ON price_action_signals(pattern_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pa_signals_confluence ON price_action_signals(confluence_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pa_signals_status ON price_action_signals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pa_signals_category ON price_action_signals(pattern_category, created_at DESC);

-- RLS Policies
ALTER TABLE price_action_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to price_action_signals"
ON price_action_signals FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role full access to price_action_signals"
ON price_action_signals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comments
COMMENT ON TABLE price_action_signals IS 'Price Action Bot signals (Bot #3) - Pure PA patterns';
COMMENT ON COLUMN price_action_signals.pattern_category IS 'Main category: BREAKOUT, REVERSAL, CONTINUATION, STRATEGY';
COMMENT ON COLUMN price_action_signals.confluence_score IS 'Score 0-100 based on number of confluence factors';
COMMENT ON COLUMN price_action_signals.sd_zone_type IS 'Supply or Demand zone if signal is based on S/D';

-- Bot settings for Price Action Bot
INSERT INTO bot_settings (key, value) VALUES
('pa_bot_enabled', 'true'),
('pa_bot_symbols', '["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT"]'),
('pa_bot_timeframes', '["15m","1h","4h"]'),
('pa_bot_min_confluence_score', '60'),
('pa_bot_min_volume_ratio', '1.3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
