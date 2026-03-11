-- Enable the pg_net extension if not already enabled (needed to make HTTP requests from Postgres)
create extension if not exists pg_net;

-- Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Create the cron job
-- Ensure "invoke-inspection-reminders" is the name uniquely identifying this schedule
select cron.schedule(
    'invoke-inspection-reminders',
    '0 * * * *', -- Every hour on the dot
    $$
    select net.http_post(
        url:='https://' || current_setting('request.headers')::jsonb->>'host' || '/functions/v1/inspection-reminders',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', current_setting('request.headers')::jsonb->>'authorization'
        )
    );
    $$
);
