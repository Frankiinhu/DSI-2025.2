import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credenciais do Supabase
const supabaseUrl = 'https://ckwxytflrrnhvyapgvyr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd3h5dGZscnJuaHZ5YXBndnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTc3NTksImV4cCI6MjA3NjI5Mzc1OX0.smRQFtQz958Z6cVUOENE2spuSD0_74cvT003cajwY8s';

if (__DEV__) {
  console.log('🔧 Configuração do Supabase:');
  console.log('  - URL:', supabaseUrl);
  console.log('  - ANON_KEY:', supabaseAnonKey ? '✅ Definida' : '❌ Não encontrada');
  console.log('✅ Cliente Supabase criado com sucesso');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-react-native',
      },
    },
  }
);
