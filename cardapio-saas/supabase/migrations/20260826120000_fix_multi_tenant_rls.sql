-- =========================================================================
-- Correção crítica de isolamento multi-tenant (RLS)
-- Contexto: auditoria mostrou que products, categories, orders, promotions,
-- cart_suggestions, addons e store_admins estavam com RLS DESLIGADO (aberto
-- a qualquer requisição, inclusive anônima), e que stores/store_settings
-- tinham policies "USING (true)" que deixavam qualquer usuário autenticado
-- ler/editar/apagar dados de QUALQUER outra loja.
--
-- Este arquivo documenta a correção aplicada em produção (rodada manualmente
-- no SQL Editor, já que o histórico local de migrations está dessincronizado
-- do banco remoto — nenhuma das migrations anteriores está registrada como
-- aplicada no remoto). Não rode via `supabase db push` sem antes confirmar
-- que o schema remoto já bate com o que está aqui, sob risco de erro de
-- "already exists".
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1) Tabelas legadas / não usadas por nenhum componente do app hoje:
--    apenas ligamos RLS sem nenhuma policy, o que bloqueia todo acesso
--    via API (select/insert/update/delete) até que alguém decida usá-las.
-- ---------------------------------------------------------------------
alter table public.addons enable row level security;
alter table public.store_admins enable row level security;

-- ---------------------------------------------------------------------
-- 2) categories — leitura pública (vitrine), escrita só do dono da loja
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "Leitura pública de categorias" on public.categories;
create policy "Leitura pública de categorias"
on public.categories for select
to public
using (true);

drop policy if exists "Dono gerencia categorias da própria loja" on public.categories;
create policy "Dono gerencia categorias da própria loja"
on public.categories for all
to authenticated
using (auth.uid() = (select user_id from public.stores where id = categories.store_id))
with check (auth.uid() = (select user_id from public.stores where id = categories.store_id));

-- ---------------------------------------------------------------------
-- 3) products — leitura pública, escrita do dono. Insert também reforça
--    o limite de 100 produtos do plano Starter direto no banco (hoje só
--    existia no componente React, sem nenhuma trava real).
-- ---------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "Leitura pública de produtos" on public.products;
create policy "Leitura pública de produtos"
on public.products for select
to public
using (true);

drop policy if exists "Dono atualiza produtos da própria loja" on public.products;
create policy "Dono atualiza produtos da própria loja"
on public.products for update
to authenticated
using (auth.uid() = (select user_id from public.stores where id = products.store_id))
with check (auth.uid() = (select user_id from public.stores where id = products.store_id));

drop policy if exists "Dono apaga produtos da própria loja" on public.products;
create policy "Dono apaga produtos da própria loja"
on public.products for delete
to authenticated
using (auth.uid() = (select user_id from public.stores where id = products.store_id));

-- Nota: a checagem de contagem abaixo é defesa em profundidade (best-effort).
-- Concorrência extrema pode permitir passar de 100 por 1-2 itens; o
-- controle "de verdade" continua sendo cosmético no client + este guard.
drop policy if exists "Dono cria produtos respeitando limite do plano" on public.products;
create policy "Dono cria produtos respeitando limite do plano"
on public.products for insert
to authenticated
with check (
  auth.uid() = (select user_id from public.stores where id = products.store_id)
  and (
    (select plan_type from public.stores where id = products.store_id) = 'pro'
    or (select count(*) from public.products p where p.store_id = products.store_id) < 100
  )
);

-- ---------------------------------------------------------------------
-- 4) promotions — feature exclusiva do plano Pro. Leitura pública (a
--    vitrine e o carrossel de banners precisam ler mesmo sem login),
--    mas só dono Pro pode criar; dono (mesmo se hoje for Starter, ex.:
--    downgrade) continua podendo editar/apagar o que já existia.
-- ---------------------------------------------------------------------
alter table public.promotions enable row level security;

drop policy if exists "Leitura pública de promoções" on public.promotions;
create policy "Leitura pública de promoções"
on public.promotions for select
to public
using (true);

drop policy if exists "Dono atualiza promoções da própria loja" on public.promotions;
create policy "Dono atualiza promoções da própria loja"
on public.promotions for update
to authenticated
using (auth.uid() = (select user_id from public.stores where id = promotions.store_id))
with check (auth.uid() = (select user_id from public.stores where id = promotions.store_id));

drop policy if exists "Dono apaga promoções da própria loja" on public.promotions;
create policy "Dono apaga promoções da própria loja"
on public.promotions for delete
to authenticated
using (auth.uid() = (select user_id from public.stores where id = promotions.store_id));

drop policy if exists "Dono Pro cria promoções" on public.promotions;
create policy "Dono Pro cria promoções"
on public.promotions for insert
to authenticated
with check (
  auth.uid() = (select user_id from public.stores where id = promotions.store_id)
  and (select plan_type from public.stores where id = promotions.store_id) = 'pro'
);

-- ---------------------------------------------------------------------
-- 5) cart_suggestions — leitura pública (aparece no carrinho do
--    cliente), escrita só do dono.
-- ---------------------------------------------------------------------
alter table public.cart_suggestions enable row level security;

drop policy if exists "Leitura pública de sugestões" on public.cart_suggestions;
create policy "Leitura pública de sugestões"
on public.cart_suggestions for select
to public
using (true);

drop policy if exists "Dono gerencia sugestões da própria loja" on public.cart_suggestions;
create policy "Dono gerencia sugestões da própria loja"
on public.cart_suggestions for all
to authenticated
using (auth.uid() = (select user_id from public.stores where id = cart_suggestions.store_id))
with check (auth.uid() = (select user_id from public.stores where id = cart_suggestions.store_id));

-- ---------------------------------------------------------------------
-- 6) product_addons — feature exclusiva do plano Pro. A policy antiga
--    de "Lojistas gerenciam seus adicionais" (ALL) é substituída para
--    separar o INSERT (que agora exige plano Pro) do restante.
-- ---------------------------------------------------------------------
drop policy if exists "Lojistas gerenciam seus adicionais" on public.product_addons;

drop policy if exists "Dono atualiza adicionais da própria loja" on public.product_addons;
create policy "Dono atualiza adicionais da própria loja"
on public.product_addons for update
to authenticated
using (auth.uid() = (select user_id from public.stores where id = product_addons.store_id))
with check (auth.uid() = (select user_id from public.stores where id = product_addons.store_id));

drop policy if exists "Dono apaga adicionais da própria loja" on public.product_addons;
create policy "Dono apaga adicionais da própria loja"
on public.product_addons for delete
to authenticated
using (auth.uid() = (select user_id from public.stores where id = product_addons.store_id));

drop policy if exists "Dono Pro cria adicionais" on public.product_addons;
create policy "Dono Pro cria adicionais"
on public.product_addons for insert
to authenticated
with check (
  auth.uid() = (select user_id from public.stores where id = product_addons.store_id)
  and (select plan_type from public.stores where id = product_addons.store_id) = 'pro'
);
-- (a policy pública de SELECT "Permitir leitura pública" já existente é mantida)

-- ---------------------------------------------------------------------
-- 7) orders — pedido é criado por clientes ANÔNIMOS no checkout (não
--    logados), então precisa de INSERT público. Leitura/edição/exclusão
--    ficam restritas ao dono da loja (painel admin).
-- ---------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "Cliente cria pedido no checkout" on public.orders;
create policy "Cliente cria pedido no checkout"
on public.orders for insert
to public
with check (status = 'pendente');

drop policy if exists "Dono gerencia pedidos da própria loja" on public.orders;
create policy "Dono gerencia pedidos da própria loja"
on public.orders for all
to authenticated
using (auth.uid() = (select user_id from public.stores where id = orders.store_id))
with check (auth.uid() = (select user_id from public.stores where id = orders.store_id));

-- ---------------------------------------------------------------------
-- 8) stores — corrige a policy de UPDATE que hoje é "USING (true)"
--    (qualquer autenticado edita qualquer loja). Também trava o
--    plan_type contra auto-alteração pelo próprio lojista (só pode
--    ser mudado fora da API, ex. SQL Editor/dashboard, até existir
--    billing automatizado). Adiciona INSERT para o próprio cadastro
--    self-service funcionar (loja só pode ser criada vinculada ao
--    usuário autenticado que acabou de se registrar).
-- ---------------------------------------------------------------------
drop policy if exists "Permitir update de lojas para admin" on public.stores;
create policy "Dono atualiza a própria loja"
on public.stores for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and plan_type = (select s2.plan_type from public.stores s2 where s2.id = stores.id)
);

drop policy if exists "Usuário autenticado cria sua própria loja" on public.stores;
create policy "Usuário autenticado cria sua própria loja"
on public.stores for insert
to authenticated
with check (auth.uid() = user_id);
-- (a policy pública de SELECT "Permitir leitura pública de lojas" já existente é mantida)

-- ---------------------------------------------------------------------
-- 9) store_settings — hoje tinha 2 policies "ALL/upsert" com
--    USING/CHECK (true) para QUALQUER autenticado. Substituídas por
--    policies restritas ao dono da loja. Mantemos só uma policy
--    pública de leitura (havia 2 duplicadas).
-- ---------------------------------------------------------------------
drop policy if exists "Permitir insert/update para admin" on public.store_settings;
drop policy if exists "Permitir upsert para usuários autenticados" on public.store_settings;
drop policy if exists "Permitir leitura pública" on public.store_settings;
-- mantém "Permitir leitura pública de configurações" como a policy pública única

drop policy if exists "Dono gerencia configurações da própria loja" on public.store_settings;
create policy "Dono gerencia configurações da própria loja"
on public.store_settings for all
to authenticated
using (auth.uid() = (select user_id from public.stores where id = store_settings.store_id))
with check (auth.uid() = (select user_id from public.stores where id = store_settings.store_id));
