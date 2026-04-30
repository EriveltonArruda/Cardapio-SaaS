-- Permitir slug como NULL para flexibilidade na criação
ALTER TABLE public.categories ALTER COLUMN slug DROP NOT NULL;