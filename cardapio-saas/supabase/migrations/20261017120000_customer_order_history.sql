-- =========================================================================
-- "Meus Pedidos" do cliente final: consulta de histórico por telefone,
-- sem exigir login (cliente final não tem conta no sistema). Mesmo
-- modelo de segurança já usado em get_loyalty_status: função RPC
-- security definer que só responde sobre o telefone exato informado —
-- orders continua sem SELECT público direto (ver migration de RLS).
-- =========================================================================

create or replace function public.get_customer_orders(p_store_id uuid, p_phone text)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  total_amount numeric,
  delivery_fee numeric,
  payment_method text,
  items jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone_normalized text := regexp_replace(p_phone, '\D', '', 'g');
begin
  return query
  select o.id, o.created_at, o.status, o.total_amount, o.delivery_fee, o.payment_method, o.items
  from public.orders o
  where o.store_id = p_store_id
    and regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone_normalized
  order by o.created_at desc
  limit 50;
end;
$$;

grant execute on function public.get_customer_orders(uuid, text) to anon, authenticated;
