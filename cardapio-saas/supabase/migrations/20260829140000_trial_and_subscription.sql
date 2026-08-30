-- =========================================================================
-- Período de teste grátis (7 dias) + controle de assinatura ativa.
-- Depois do trial, uma loja sem `subscription_active = true` fica bloqueada
-- (painel admin e cardápio público) até o dono do SaaS confirmar o
-- pagamento manualmente em /painel-saas.
-- =========================================================================

alter table public.stores
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '7 days'),
  add column if not exists subscription_active boolean not null default false;

-- Lojas que já existiam antes desta feature são "perdoadas": continuam
-- funcionando normalmente sem precisar pagar retroativo por um trial que
-- nunca existiu pra elas.
update public.stores set subscription_active = true where subscription_active = false;
