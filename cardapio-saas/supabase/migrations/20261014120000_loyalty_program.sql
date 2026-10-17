-- =========================================================================
-- Programa de fidelidade (feature Pro): a cada N pedidos CONCLUÍDOS de um
-- mesmo telefone numa loja, o cliente ganha um desconto percentual
-- automático no próximo pedido.
--
-- Decisão de design: a tabela loyalty_rewards NÃO é publicamente legível
-- (vazaria telefone + histórico de qualquer cliente pra quem soubesse
-- consultar). Em vez disso, duas funções RPC fazem o trabalho:
--   - get_loyalty_status: consulta o progresso de UM telefone específico
--     (quem não sabe o telefone não descobre nada de outra pessoa).
--   - redeem_loyalty_reward: marca a recompensa como usada, vinculando ao
--     pedido, e confere que o pedido é realmente do mesmo telefone.
-- O cálculo de quando conceder a recompensa roda num trigger no próprio
-- banco (na transição de status pra "concluido"), não depende do client.
-- =========================================================================

alter table public.store_settings
  add column if not exists loyalty_enabled boolean not null default false,
  add column if not exists loyalty_orders_required integer not null default 10,
  add column if not exists loyalty_discount_percent numeric not null default 10;

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_phone text not null,
  milestone integer not null,
  discount_percent numeric not null,
  redeemed boolean not null default false,
  redeemed_order_id uuid references public.orders(id),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (store_id, customer_phone, milestone)
);

alter table public.loyalty_rewards enable row level security;

-- Sem policy de SELECT/INSERT/UPDATE pra "public"/"authenticated" de
-- propósito: todo acesso passa pelas funções abaixo (security definer) ou
-- pelo dono da loja (pra eventualmente auditar no admin).
drop policy if exists "Dono consulta recompensas da própria loja" on public.loyalty_rewards;
create policy "Dono consulta recompensas da própria loja"
on public.loyalty_rewards for select
to authenticated
using (auth.uid() = (select user_id from public.stores where id = loyalty_rewards.store_id));

-- ---------------------------------------------------------------------
-- Trigger: concede a recompensa quando um pedido vira "concluido".
-- ---------------------------------------------------------------------
create or replace function public.handle_loyalty_on_order_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_required integer;
  v_discount numeric;
  v_phone_normalized text;
  v_completed_count integer;
  v_milestone integer;
begin
  if NEW.status <> 'concluido' or OLD.status = 'concluido' then
    return NEW;
  end if;

  select loyalty_enabled, loyalty_orders_required, loyalty_discount_percent
    into v_enabled, v_required, v_discount
  from public.store_settings
  where store_id = NEW.store_id;

  if v_enabled is not true or v_required is null or v_required <= 0 then
    return NEW;
  end if;

  v_phone_normalized := regexp_replace(NEW.customer_phone, '\D', '', 'g');

  select count(*) into v_completed_count
  from public.orders
  where store_id = NEW.store_id
    and status = 'concluido'
    and regexp_replace(customer_phone, '\D', '', 'g') = v_phone_normalized;

  if v_completed_count > 0 and v_completed_count % v_required = 0 then
    v_milestone := v_completed_count / v_required;
    insert into public.loyalty_rewards (store_id, customer_phone, milestone, discount_percent)
    values (NEW.store_id, v_phone_normalized, v_milestone, v_discount)
    on conflict (store_id, customer_phone, milestone) do nothing;
  end if;

  return NEW;
end;
$$;

drop trigger if exists loyalty_on_order_completed on public.orders;
create trigger loyalty_on_order_completed
  after update on public.orders
  for each row
  execute function public.handle_loyalty_on_order_completed();

-- ---------------------------------------------------------------------
-- RPC: consulta o progresso de fidelidade de UM telefone (chamável por
-- anon/authenticated — quem não souber o telefone não descobre nada).
-- ---------------------------------------------------------------------
create or replace function public.get_loyalty_status(p_store_id uuid, p_phone text)
returns table (
  enabled boolean,
  orders_required integer,
  discount_percent numeric,
  completed_orders integer,
  orders_until_next integer,
  has_unredeemed_reward boolean,
  reward_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_required integer;
  v_discount numeric;
  v_phone_normalized text := regexp_replace(p_phone, '\D', '', 'g');
  v_completed integer;
  v_reward record;
begin
  select loyalty_enabled, loyalty_orders_required, loyalty_discount_percent
    into v_enabled, v_required, v_discount
  from public.store_settings
  where store_id = p_store_id;

  if v_enabled is not true then
    return query select false, 0, 0::numeric, 0, 0, false, null::uuid;
    return;
  end if;

  select count(*) into v_completed
  from public.orders
  where store_id = p_store_id
    and status = 'concluido'
    and regexp_replace(customer_phone, '\D', '', 'g') = v_phone_normalized;

  select * into v_reward
  from public.loyalty_rewards
  where store_id = p_store_id
    and customer_phone = v_phone_normalized
    and redeemed = false
  order by created_at asc
  limit 1;

  return query select
    true,
    v_required,
    v_discount,
    v_completed,
    case
      when v_required <= 0 then 0
      when v_completed % v_required = 0 then v_required
      else v_required - (v_completed % v_required)
    end,
    (v_reward.id is not null),
    v_reward.id;
end;
$$;

grant execute on function public.get_loyalty_status(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC: marca uma recompensa como usada, vinculando ao pedido. Confere que
-- o pedido é realmente do mesmo telefone da recompensa, pra ninguém
-- "gastar" a recompensa de outra pessoa.
-- ---------------------------------------------------------------------
create or replace function public.redeem_loyalty_reward(p_reward_id uuid, p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward_phone text;
  v_order_phone text;
begin
  select customer_phone into v_reward_phone from public.loyalty_rewards where id = p_reward_id and redeemed = false;
  if v_reward_phone is null then
    return false;
  end if;

  select regexp_replace(customer_phone, '\D', '', 'g') into v_order_phone from public.orders where id = p_order_id;
  if v_order_phone is null or v_order_phone <> v_reward_phone then
    return false;
  end if;

  update public.loyalty_rewards
  set redeemed = true, redeemed_at = now(), redeemed_order_id = p_order_id
  where id = p_reward_id and redeemed = false;

  return true;
end;
$$;

grant execute on function public.redeem_loyalty_reward(uuid, uuid) to anon, authenticated;
