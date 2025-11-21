/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// O Vite expõe as variáveis de ambiente através do objeto import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança para garantir que as variáveis existem
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase URL e Key não encontradas. Verifique se o arquivo .env.local foi criado corretamente na raiz do projeto.'
  );
}

// Cria e exporta a instância única do cliente para ser usada em todo o app
export const supabase = createClient(supabaseUrl, supabaseKey);