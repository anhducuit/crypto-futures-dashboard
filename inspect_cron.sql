-- Query 1: Check all cron jobs
SELECT jobid, jobname, schedule, command 
FROM cron.job;

-- Query 2: Check recent run history for the Price Action Bot
SELECT 
    runid,
    jobid,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'price-action-bot-scan')
ORDER BY start_time DESC
LIMIT 10;

-- Query 3: Check recent run history for the Check Trades Bot
SELECT 
    runid,
    jobid,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-trades-every-minute')
ORDER BY start_time DESC
LIMIT 10;
