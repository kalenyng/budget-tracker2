create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month date not null,
  date text,
  description text,
  amount numeric not null default 0,
  category_id uuid references categories(id) on delete set null,
  manually_edited boolean default false,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Users can manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index transactions_user_month_idx on transactions(user_id, month);

alter table transactions
  add constraint transactions_natural_key
    unique (user_id, month, date, description, amount);
