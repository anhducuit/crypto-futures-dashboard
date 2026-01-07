
create table if not exists bot_settings (
    id bigint primary key generated always as identity,
    key text unique not null,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if not exists
insert into bot_settings (key, value)
values ('allowed_timeframes', '["15m", "1h", "4h"]'::jsonb)
on conflict (key) do nothing;

-- Enable RLS (though Edge Function uses Service Role usually, good practice)
alter table bot_settings enable row level security;

create policy "Enable read access for all users" on bot_settings for select using (true);
create policy "Enable update for service role only" on bot_settings for update using (true);
