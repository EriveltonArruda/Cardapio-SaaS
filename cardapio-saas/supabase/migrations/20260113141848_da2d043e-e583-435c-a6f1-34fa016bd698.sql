-- Drop restrictive policies and recreate as permissive
-- Categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Addons
DROP POLICY IF EXISTS "Public can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addons;

CREATE POLICY "Anyone can view active addons"
ON public.addons FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage addons"
ON public.addons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));