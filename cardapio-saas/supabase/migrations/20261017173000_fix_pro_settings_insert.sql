-- =========================================================================
-- Correção da migration anterior (20261017170000): a policy de INSERT
-- exigia o literal '#1caf08' como cor padrão, mas o DEFAULT real da
-- coluna no banco é '#FACC15' — um insert sem especificar a cor (ex.:
-- qualquer fluxo que não seja o register/page.tsx atual, que seta a cor
-- explicitamente) falhava com 403 mesmo sendo uma criação legítima.
--
-- Simplifica: o INSERT inicial não é mais restrito por campo (quem está
-- criando a própria loja por definição não está "roubando" customização
-- de ninguém — é a primeira vez que a linha existe). A trava de verdade
-- fica só no UPDATE, que já impede mudar esses campos depois da criação
-- sem ser Pro — e é por aí que a tela de Configurações sempre passa
-- (store_settings já existe desde o registro, então handleSave sempre
-- cai no caminho de UPDATE via upsert).
-- =========================================================================

drop policy if exists "Dono cria configurações respeitando o plano" on public.store_settings;

create policy "Dono cria configurações da própria loja"
on public.store_settings for insert
to authenticated
with check (auth.uid() = (select user_id from public.stores where id = store_settings.store_id));
