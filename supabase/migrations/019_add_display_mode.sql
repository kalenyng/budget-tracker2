insert into user_settings (user_id, key, value)
select id, 'display_mode', 'auto'
from auth.users
on conflict (user_id, key) do nothing;
