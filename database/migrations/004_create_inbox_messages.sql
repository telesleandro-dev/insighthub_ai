-- Create table for storing forwarded email messages for analysis
create table if not exists inbox_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  sender varchar(255) not null,
  subject text,
  body_text text,
  received_at timestamptz default now(),
  
  -- Analysis fields
  category varchar(50), -- 'preco', 'duvida_resultado', 'urgencia', etc.
  sentiment varchar(20), -- 'negativo', 'neutro', 'positivo'
  processed boolean default false,
  
  created_at timestamptz default now()
);

-- Index for faster aggregation by category and date
create index if not exists idx_inbox_messages_user_date on inbox_messages(user_id, received_at);
create index if not exists idx_inbox_messages_category on inbox_messages(category);

-- RLS Policies
alter table inbox_messages enable row level security;

create policy "Users can view their own messages"
  on inbox_messages for select
  using (auth.uid() = user_id);

create policy "Service role can insert messages"
  on inbox_messages for insert
  with check (true); -- Usually incoming webhooks use service role

create policy "Users can update their own messages (for reprocessing)"
  on inbox_messages for update
  using (auth.uid() = user_id);
