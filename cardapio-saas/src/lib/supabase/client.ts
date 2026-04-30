import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types'; // Importando a tipagem que refatoramos

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Em ambiente de desenvolvimento, isso ajuda a diagnosticar erros de env rapidamente
  if (process.env.NODE_ENV === 'development') {
    console.warn("🚨 Atenção: Variáveis NEXT_PUBLIC_SUPABASE não encontradas no arquivo .env");
  }
}

// Cliente tipado para o seu modelo SaaS
export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // O Supabase detecta automaticamente se está no navegador para usar o storage
    }
  }
);