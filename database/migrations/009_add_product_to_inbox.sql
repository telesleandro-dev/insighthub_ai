-- Add product relationship to inbox_messages
alter table inbox_messages
  add column if not exists product_id uuid references products(id) on delete set null;

-- Index for faster filtering by product
create index if not exists idx_inbox_messages_product_id on inbox_messages(product_id);

-- Add AI-identified product name (fallback)
alter table inbox_messages
  add column if not exists produto_identificado text;
