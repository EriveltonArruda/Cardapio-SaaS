-- Fix overly permissive RLS policies for categories, products, and addons tables
-- Restore admin-only access for managing these tables

-- Drop overly permissive policies for categories
DROP POLICY IF EXISTS "Authenticated users have full access to categories" ON public.categories;

-- Create admin-only policy for categories
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop overly permissive policies for products
DROP POLICY IF EXISTS "Authenticated users have full access to products" ON public.products;

-- Create admin-only policy for products
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop overly permissive policies for addons
DROP POLICY IF EXISTS "Authenticated users have full access to addons" ON public.addons;

-- Create admin-only policy for addons
CREATE POLICY "Admins can manage addons"
ON public.addons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));