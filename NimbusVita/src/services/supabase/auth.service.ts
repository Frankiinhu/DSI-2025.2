import { supabase } from '../../config/supabase';
import { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export interface AuthResponse {
  ok: boolean;
  message?: string;
  user?: Profile;
}

/**
 * Registra um novo usuário no Supabase
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // 1. Validação básica
    if (!username || !email || !password) {
      return { ok: false, message: 'Todos os campos são obrigatórios' };
    }

    if (password.length < 6) {
      return { ok: false, message: 'Senha deve ter no mínimo 6 caracteres' };
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { ok: false, message: 'Email inválido' };
    }

    // 2. Verificar se username já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .single();

    if (existingProfile) {
      return { ok: false, message: 'Nome de usuário já existe' };
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { ok: false, message: authError.message };
    }

    if (!authData.user) {
      return { ok: false, message: 'Erro ao criar usuário' };
    }

    // 4. Criar perfil no banco
    const profileData: ProfileInsert = {
      id: authData.user.id,
      username: username.trim(),
      email: email.trim().toLowerCase(),
    };

    console.log('Tentando criar perfil:', profileData);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // Fazer logout do usuário criado
      await supabase.auth.signOut();
      return { 
        ok: false, 
        message: `Erro ao criar perfil: ${profileError.message}. Por favor, contate o suporte.` 
      };
    }

    return { ok: true, user: profile };
  } catch (error) {
    console.error('Register error:', error);
    return { ok: false, message: 'Erro inesperado ao registrar' };
  }
};

/**
 * Faz login do usuário
 */
export const loginUser = async (
  emailOrUsername: string,
  password: string
): Promise<AuthResponse> => {
  try {
    if (!emailOrUsername || !password) {
      return { ok: false, message: 'Preencha todos os campos' };
    }

    let email = emailOrUsername.trim();

    // Se não é email, buscar email pelo username
    if (!email.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email)
        .single();

      if (!profile) {
        return { ok: false, message: 'Credenciais inválidas' };
      }

      email = profile.email;
    }

    // Login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { ok: false, message: 'Credenciais inválidas' };
    }

    if (!data.user) {
      return { ok: false, message: 'Erro ao fazer login' };
    }

    // Buscar perfil completo
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { ok: true, user: profile || undefined };
  } catch (error) {
    console.error('Login error:', error);
    return { ok: false, message: 'Erro inesperado ao fazer login' };
  }
};

/**
 * Faz logout do usuário
 */
export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async (): Promise<Profile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Atualiza o perfil do usuário
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return { ok: false, message: 'Erro ao atualizar perfil' };
    }

    return { ok: true, user: data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { ok: false, message: 'Erro inesperado ao atualizar perfil' };
  }
};

/**
 * Verifica se há uma sessão ativa
 */
export const getSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};
