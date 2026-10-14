-- =========================================================================
-- Taxa de entrega configurável (feature Pro): valor fixo por loja, com
-- opção de "grátis acima de R$ X". Guardamos o valor cobrado em cada pedido
-- (orders.delivery_fee) para o histórico não mudar se o lojista alterar a
-- taxa depois.
-- =========================================================================

alter table public.store_settings
  add column if not exists delivery_fee numeric not null default 0,
  add column if not exists free_delivery_min numeric;

alter table public.orders
  add column if not exists delivery_fee numeric not null default 0;
