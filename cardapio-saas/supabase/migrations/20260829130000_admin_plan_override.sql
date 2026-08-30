-- =========================================================================
-- Permite que um usuário com papel 'admin' (tabela user_roles) altere
-- qualquer loja — em particular o plan_type, hoje travado contra edição
-- pelo próprio lojista (ver 20260826120000_fix_multi_tenant_rls.sql).
-- Usado pela tela /painel-saas, onde o dono do SaaS confirma um pagamento
-- manual e faz o upgrade Starter -> Pro de uma loja específica.
-- =========================================================================

drop policy if exists "Admin da plataforma gerencia qualquer loja" on public.stores;
create policy "Admin da plataforma gerencia qualquer loja"
on public.stores for update
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));
