-- Cleanup bot_settings: Keep only the latest entry for each key
DELETE FROM bot_settings 
WHERE id NOT IN (
    SELECT MAX(id) 
    FROM bot_settings 
    GROUP BY key
);

-- Add UNIQUE constraint to key column
ALTER TABLE bot_settings ADD CONSTRAINT bot_settings_key_unique UNIQUE (key);

-- Unschedue existing job if exists
SELECT cron.unschedule('check-trades-every-minute');

-- Schedule again with correct parameters (using SERVICE_ROLE_KEY if possible, but actually anonymized is fine if --no-verify-jwt)
-- However, let's use the full URL and ensure it's correct.
SELECT
  cron.schedule(
    'check-trades-every-minute',
    '* * * * *',
    $$
    select
      net.http_post(
        url:='https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
