-- =========================================================================
-- Achado numa auditoria de consistência das features Pro: product_addons
-- e promotions já tinham a trava de plano reforçada no banco (migrations
-- anteriores), mas as features Pro que vivem dentro de store_settings
-- (Identidade Visual, Chave Pix, Taxa de Entrega, Fidelidade) nunca
-- tiveram — só eram escondidas no client pelo PlanGuard. Testado contra
-- produção: uma loja Starter conseguia salvar cor personalizada, chave
-- Pix, taxa de entrega e fidelidade via chamada direta à API, contornando
-- a UI completamente.
--
-- Corrige substituindo a policy única "ALL" de store_settings por
-- policies separadas de INSERT/UPDATE que travam esses campos pra quem
-- não é Pro: no INSERT, exige os valores padrão do Starter; no UPDATE,
-- exige que esses campos não mudem em relação ao valor atual, a menos
-- que a loja seja Pro.
-- =========================================================================

drop policy if exists "Dono gerencia configurações da própria loja" on public.store_settings;

create policy "Dono cria configurações respeitando o plano"
on public.store_settings for insert
to authenticated
with check (
  auth.uid() = (select user_id from public.stores where id = store_settings.store_id)
  and (
    (select plan_type from public.stores where id = store_settings.store_id) = 'pro'
    or (
      primary_color = '#1caf08'
      and text_color = '#111111'
      and pix_key is null
      and delivery_fee = 0
      and free_delivery_min is null
      and loyalty_enabled = false
    )
  )
);

create policy "Dono atualiza configurações respeitando o plano"
on public.store_settings for update
to authenticated
using (auth.uid() = (select user_id from public.stores where id = store_settings.store_id))
with check (
  auth.uid() = (select user_id from public.stores where id = store_settings.store_id)
  and (
    (select plan_type from public.stores where id = store_settings.store_id) = 'pro'
    or (
      primary_color = (select s2.primary_color from public.store_settings s2 where s2.id = store_settings.id)
      and text_color = (select s2.text_color from public.store_settings s2 where s2.id = store_settings.id)
      and coalesce(pix_key, '') = coalesce((select s2.pix_key from public.store_settings s2 where s2.id = store_settings.id), '')
      and delivery_fee = (select s2.delivery_fee from public.store_settings s2 where s2.id = store_settings.id)
      and coalesce(free_delivery_min, -1) = coalesce((select s2.free_delivery_min from public.store_settings s2 where s2.id = store_settings.id), -1)
      and loyalty_enabled = (select s2.loyalty_enabled from public.store_settings s2 where s2.id = store_settings.id)
      and loyalty_orders_required = (select s2.loyalty_orders_required from public.store_settings s2 where s2.id = store_settings.id)
      and loyalty_discount_percent = (select s2.loyalty_discount_percent from public.store_settings s2 where s2.id = store_settings.id)
    )
  )
);

create policy "Dono apaga configurações da própria loja"
on public.store_settings for delete
to authenticated
using (auth.uid() = (select user_id from public.stores where id = store_settings.store_id));

-- (as policies públicas de SELECT já existentes continuam valendo)
