-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the Edge Function to run every minute
select
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
