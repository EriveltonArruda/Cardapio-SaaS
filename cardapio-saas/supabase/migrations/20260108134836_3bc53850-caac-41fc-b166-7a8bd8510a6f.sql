-- Add is_suggestion column to products table
ALTER TABLE public.products 
ADD COLUMN is_suggestion boolean DEFAULT false;

-- Add category slugs for cross-sell mapping (Gins category)
INSERT INTO public.categories (name, slug, icon, sort_order, is_active)
VALUES ('Gins', 'gins', '🍸', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Create index for faster suggestion queries
CREATE INDEX IF NOT EXISTS idx_products_is_suggestion ON public.products(is_suggestion) WHERE is_suggestion = true;