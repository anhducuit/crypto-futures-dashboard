-- Enable RLS on market_anomalies if not already
ALTER TABLE market_anomalies ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) access for SELECT
CREATE POLICY "Allow public read access for market_anomalies"
ON market_anomalies
FOR SELECT
TO public
USING (true);

-- Ensure index on symbol and created_at for performance
CREATE INDEX IF NOT EXISTS idx_market_anomalies_symbol_created_at ON market_anomalies(symbol, created_at DESC);
