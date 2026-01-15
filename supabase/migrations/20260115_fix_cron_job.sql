-- ROBUST FIX FOR CRON JOB
-- This version handles the error if the job was not previously scheduled

DO $$
BEGIN
    -- 1. Try to unschedule if it exists, ignore if not found
    PERFORM cron.unschedule('check-trades-every-minute');
EXCEPTION WHEN OTHERS THEN
    -- If job doesn't exist, just continue
END $$;

-- 2. Schedule the job (Run this part every time)
SELECT cron.schedule(
  'check-trades-every-minute',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    )
  $$
);

-- 3. Confirmation
SELECT * FROM cron.job WHERE jobname = 'check-trades-every-minute';
