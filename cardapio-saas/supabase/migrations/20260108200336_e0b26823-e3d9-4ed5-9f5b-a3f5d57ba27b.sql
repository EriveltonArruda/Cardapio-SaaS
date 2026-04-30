-- Drop all existing policies on categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Create simple policy: any authenticated user has full access
CREATE POLICY "Authenticated users have full access to categories"
ON public.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow public read for active categories (for the storefront)
CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
TO anon
USING (is_active = true);

-- Drop all existing policies on products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create simple policy: any authenticated user has full access
CREATE POLICY "Authenticated users have full access to products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow public read for active products (for the storefront)
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- Drop all existing policies on addons
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can view all addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can insert addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can update addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can delete addons" ON public.addons;

-- Create simple policy: any authenticated user has full access
CREATE POLICY "Authenticated users have full access to addons"
ON public.addons
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow public read for active addons (for the storefront)
CREATE POLICY "Public can view active addons"
ON public.addons
FOR SELECT
TO anon
USING (is_active = true);