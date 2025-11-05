import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credenciais do Supabase (configuradas no arquivo .env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (__DEV__) {
  console.log('🔧 Configuração do Supabase:');
  console.log('  - URL:', supabaseUrl ? '✅ Definida' : '❌ Não encontrada');
  console.log('  - ANON_KEY:', supabaseAnonKey ? '✅ Definida' : '❌ Não encontrada');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '❌ ERRO CRÍTICO: Credenciais do Supabase não encontradas!\n\n' +
      'Por favor, configure o arquivo .env com:\n' +
      '- EXPO_PUBLIC_SUPABASE_URL\n' +
      '- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
      'Veja o arquivo .env.example para referência.'
    );
  } else {
    console.log('✅ Cliente Supabase criado com sucesso');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
