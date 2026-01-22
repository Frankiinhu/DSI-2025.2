import { supabase } from '../../config/supabase';
import { Database } from '../../types/database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

const USERNAME_INDEX_KEY = 'nimbus_usernames';

export interface AuthResponse {
  ok: boolean;
  message?: string;
  user?: Profile;
}

const getUsernameIndex = async (): Promise<Record<string, string>> => {
  try {
    const raw = await AsyncStorage.getItem(USERNAME_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    logger.error('Error reading username index from AsyncStorage', { error });
    return {};
  }
};

const setUsernameIndex = async (index: Record<string, string>) => {
  try {
    await AsyncStorage.setItem(USERNAME_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    logger.error('Error saving username index to AsyncStorage', { error });
  }
};

/**
 * Registra um novo usuário no Supabase
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  fullName?: string,
  birthdateIso?: string, // ISO date string yyyy-mm-dd
  gender?: 'masculino' | 'feminino' | 'outro'
): Promise<AuthResponse> => {
  try {
    if (!username || !email || !password) return { ok: false, message: 'Todos os campos são obrigatórios' };
    if (password.length < 6) return { ok: false, message: 'Senha deve ter no mínimo 6 caracteres' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return { ok: false, message: 'Email inválido' };

    // 2. Verificar se username já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .single();

    if (existingProfile) return { ok: false, message: 'Nome de usuário já existe' };

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: username.trim() } },
    });

    if (authError) {
      logger.error('Supabase auth signup error', { error: authError, email });
      return { ok: false, message: authError.message };
    }

    if (!authData.user) {
      logger.error('Auth signup succeeded but no user returned');
      return { ok: false, message: 'Erro ao criar usuário' };
    }

    logger.info('User created in auth', { userId: authData.user.id, email });

    // 4. Criar perfil no banco
    const computeAge = (iso?: string) => {
      if (!iso) return undefined;
      const dob = new Date(iso);
      const diff = Date.now() - dob.getTime();
      const ageDt = new Date(diff);
      return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const age = computeAge(birthdateIso);

    const profileData: ProfileInsert = {
      id: authData.user.id,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      full_name: fullName ?? null,
      age: age ?? null,
      gender: gender ?? null,
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      logger.error('Error creating user profile', { error: profileError, userId: authData.user.id });
      await supabase.auth.signOut();
      return { ok: false, message: `Erro ao criar perfil: ${profileError.message}` };
    }

    logger.info('User profile created successfully', { userId: profile.id, username });

    try {
      const index = await getUsernameIndex();
      index[username.trim()] = email.trim().toLowerCase();
      await setUsernameIndex(index);
    } catch (error) {
      logger.warn('Failed to update local username index', { error, username });
    }

    return { ok: true, user: profile };
  } catch (error) {
    logger.error('Unexpected error during user registration', { error, email });
    return { ok: false, message: 'Erro inesperado ao registrar' };
  }
};

/**
 * Faz login do usuário (aceita email ou username)
 */
export const loginUser = async (
  emailOrUsername: string,
  password: string
): Promise<AuthResponse> => {
  try {
    if (!emailOrUsername || !password) return { ok: false, message: 'Preencha todos os campos' };

    let email = emailOrUsername.trim();

    // Se não é email, buscar email pelo username
    if (!email.includes('@')) {
      logger.debug('Login with username, resolving email', { username: email });
      const index = await getUsernameIndex();
      const found = index[email];
      if (found) {
        email = found;
        logger.debug('Email resolved from local index', { username: emailOrUsername });
      } else {
        // fallback: query profiles table
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', email)
            .single();
          
          if (profileError || !profile) {
            logger.warn('Username not found in database', { username: email, error: profileError });
            return { ok: false, message: 'Credenciais inválidas' };
          }
          email = profile.email;
          logger.debug('Email resolved from database', { username: emailOrUsername });
        } catch (profileErr) {
          logger.error('Error looking up username', { error: profileErr, username: email });
          if (profileErr instanceof Error && 
              (profileErr.message?.includes('Network request failed') || 
               profileErr.name === 'AuthRetryableFetchError')) {
            return { ok: false, message: 'Erro de conexão. Verifique sua internet e tente novamente.' };
          }
          return { ok: false, message: 'Credenciais inválidas' };
        }
      }
    }

    logger.info('Attempting user login', { email });
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
    
    if (error) {
      logger.error('Login failed', { error, email });
      if (error.message?.includes('Network request failed') || error.name === 'AuthRetryableFetchError') {
        return { ok: false, message: 'Erro de conexão. Verifique sua internet e tente novamente.' };
      }
      if (error.message?.includes('Invalid login credentials')) {
        return { ok: false, message: 'Email ou senha incorretos' };
      }
      return { ok: false, message: error.message || 'Credenciais inválidas' };
    }
    
    if (!data.user) {
      logger.error('Login succeeded but no user returned');
      return { ok: false, message: 'Erro ao fazer login' };
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    logger.info('User logged in successfully', { userId: data.user.id });
    
    return { ok: true, user: profile || undefined };
  } catch (error) {
    logger.error('Unexpected error during login', { error });
    if (error instanceof Error && 
        (error.message?.includes('Network request failed') || 
         error.name === 'AuthRetryableFetchError')) {
      return { ok: false, message: 'Erro de conexão. Verifique sua internet e tente novamente.' };
    }
    return { ok: false, message: 'Erro inesperado ao fazer login' };
  }
};

/**
 * Faz logout do usuário
 */
export const signOut = async (): Promise<void> => {
  try {
    logger.info('User signing out');
    await supabase.auth.signOut();
    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Error during sign out', { error });
  }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async (): Promise<Profile | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logger.error('Error getting current user from auth', { error: authError });
      // Network errors should not prevent app from loading
      if (authError.message?.includes('Network request failed') || authError.name === 'AuthRetryableFetchError') {
        logger.warn('Network error getting user, app will continue without session');
      }
      return null;
    }

    if (!user) {
      logger.debug('No authenticated user found');
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching user profile', { error, userId: user.id });
      return null;
    }

    if (profile) {
      logger.debug('Current user profile loaded', { userId: profile.id });
    }
    
    return profile;
    
  } catch (error) {
    logger.error('Unexpected error getting current user', { error });
    if (error instanceof Error && 
        (error.message?.includes('Network request failed') || 
         error.name === 'AuthRetryableFetchError')) {
      logger.warn('Network error getting user, app will continue without session');
    }
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
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) {
      console.error('Update profile error:', error);
      return { ok: false, message: 'Erro ao atualizar perfil' };
    }

    if (updates.username) {
      try {
        const index = await getUsernameIndex();
        const emailOfUser = data.email;
        Object.keys(index).forEach(k => { if (index[k] === emailOfUser) delete index[k]; });
        index[updates.username as string] = emailOfUser;
        await setUsernameIndex(index);
      } catch (e) {
        console.warn('Erro atualizando índice local de usernames após updateProfile:', e);
      }
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