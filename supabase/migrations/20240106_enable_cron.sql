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
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-trades',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
