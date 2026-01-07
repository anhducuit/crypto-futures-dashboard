-- Reactivate Cron Job
-- 1. Unschedue any existing job with this name
SELECT cron.unschedule('check-trades-every-minute');

-- 2. Schedule again with the simplest but most reliable syntax
SELECT cron.schedule(
  'check-trades-every-minute',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g"}'::jsonb
    )
  $$
);
