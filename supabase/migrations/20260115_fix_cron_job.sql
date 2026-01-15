-- FIX CRON JOB FOR check-trades
-- This SQL unschedules and reschedules the bot trigger every minute
-- Run this in your Supabase SQL Editor if the Bot Status shows OFFLINE.

-- 1. Unschedule existing job
SELECT cron.unschedule('check-trades-every-minute');

-- 2. Schedule again with the simplest configuration (No JWT Auth)
-- This works because the function is served with --no-verify-jwt or handles it internally
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

-- 3. Verify job exists
-- SELECT * FROM cron.job;
