-- Reactivate Cron Job WITHOUT Authorization header (since we use --no-verify-jwt)
SELECT cron.unschedule('check-trades-every-minute');

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
