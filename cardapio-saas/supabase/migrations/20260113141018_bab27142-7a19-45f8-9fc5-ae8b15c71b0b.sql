-- Add public READ policy for categories (everyone can view active categories)
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

-- Add public READ policy for products (everyone can view active products)  
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true);

-- Add public READ policy for addons (everyone can view active addons)
CREATE POLICY "Anyone can view active addons"
ON public.addons FOR SELECT
USING (is_active = true);