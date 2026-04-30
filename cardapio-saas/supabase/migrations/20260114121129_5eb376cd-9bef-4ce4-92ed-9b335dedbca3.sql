-- Simplificar RLS: permitir ALL para qualquer usuário autenticado
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Categories: qualquer usuário autenticado pode gerenciar
CREATE POLICY "Authenticated users can manage categories" 
ON public.categories 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Products: qualquer usuário autenticado pode gerenciar
CREATE POLICY "Authenticated users can manage products" 
ON public.products 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);