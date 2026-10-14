-- =========================================================================
-- Achado durante teste end-to-end em produção: a policy de UPDATE do dono
-- em `stores` travava só o `plan_type` contra auto-edição, mas não
-- `trial_ends_at`/`subscription_active` — um lojista conseguia estender o
-- próprio trial ou se auto-liberar da assinatura via chamada direta à API,
-- contornando completamente o /painel-saas.
-- =========================================================================

drop policy if exists "Dono atualiza a própria loja" on public.stores;
create policy "Dono atualiza a própria loja"
on public.stores for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and plan_type = (select s2.plan_type from public.stores s2 where s2.id = stores.id)
  and trial_ends_at = (select s2.trial_ends_at from public.stores s2 where s2.id = stores.id)
  and subscription_active = (select s2.subscription_active from public.stores s2 where s2.id = stores.id)
);
