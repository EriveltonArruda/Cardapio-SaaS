-- Corrigir políticas RLS para serem PERMISSIVE (padrão correto)

-- Categories: remover políticas antigas e criar novas PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users have full access to categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;

CREATE POLICY "Authenticated users have full access to categories"
ON public.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
TO anon
USING (is_active = true);

-- Products: remover políticas antigas e criar novas PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users have full access to products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

CREATE POLICY "Authenticated users have full access to products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- Addons: remover políticas antigas e criar novas PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users have full access to addons" ON public.addons;
DROP POLICY IF EXISTS "Public can view active addons" ON public.addons;

CREATE POLICY "Authenticated users have full access to addons"
ON public.addons
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view active addons"
ON public.addons
FOR SELECT
TO anon
USING (is_active = true);