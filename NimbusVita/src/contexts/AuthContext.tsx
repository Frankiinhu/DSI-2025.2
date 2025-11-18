import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { 
  getCurrentUser, 
  loginUser, 
  registerUser, 
  signOut as authSignOut 
} from '../services/supabase/auth.service';
import { 
  clearLocalCheckups,
  syncCheckupsOnStartup 
} from '../services/supabase/checkup.storage.service';
import type { Database } from '../types/database.types';

// Type aliases
type Profile = Database['public']['Tables']['profiles']['Row'];

// Tipo do contexto de autenticação
type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (username: string, email: string, password: string, fullName?: string, birthdateIso?: string, gender?: 'masculino' | 'feminino' | 'outro') => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;

  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
};

// Criar o contexto
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Props do Provider
type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Provider de Autenticação
 * Gerencia o estado global de autenticação do usuário
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Verificar sessão inicial ao montar o componente
    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;
        if (__DEV__) console.log('Auth state changed:', event);
        
        if (session?.user) {
          // Usuário logou - buscar perfil completo
          if (isMountedRef.current) await loadUserProfile();
        } else {
          // Usuário deslogou - limpar dados locais
          if (isMountedRef.current) {
            await clearLocalCheckups();
            setUser(null);
          }
        }
      }
    );

    // Cleanup: remover listener ao desmontar
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Verificar sessão inicial
   */
  const checkSession = async () => {
    if (!isMountedRef.current) return;
    if (__DEV__) console.log('🔍 Iniciando verificação de sessão...');
    
    try {
      if (isMountedRef.current) setLoading(true);
      
      if (__DEV__) console.log('📡 Buscando usuário atual...');
      const profile = await Promise.race([
        getCurrentUser(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
        )
      ]);
      
      if (!isMountedRef.current) return;
      
      if (__DEV__) console.log('✅ Usuário obtido:', profile ? `ID: ${profile.id}` : 'Nenhum usuário');
      setUser(profile);
      
      // Se há usuário autenticado, sincronizar dados do Supabase
      if (profile) {
        if (__DEV__) console.log('🔄 Usuário autenticado - iniciando sincronização...');
        syncCheckupsOnStartup(profile.id).catch(err => 
          console.error('⚠️ Erro na sincronização inicial:', err)
        );
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      if (isMountedRef.current) setUser(null);
    } finally {
      if (__DEV__) console.log('✅ Verificação de sessão finalizada. Loading = false');
      if (isMountedRef.current) setLoading(false);
    }
  };

  /**
   * Carregar perfil do usuário
   */
  const loadUserProfile = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const profile = await getCurrentUser();
      if (!isMountedRef.current) return;
      
      setUser(profile);
      
      // Sincronizar dados quando o usuário faz login
      if (profile) {
        if (__DEV__) console.log('🔄 Login detectado - sincronizando dados...');
        syncCheckupsOnStartup(profile.id).catch(err => 
          console.error('Erro na sincronização pós-login:', err)
        );
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (isMountedRef.current) setUser(null);
    }
  };

  /**
   * Login
   */
  const signIn = async (
    emailOrUsername: string, 
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await loginUser(emailOrUsername, password);
      
      if (result.ok && result.user) {
        setUser(result.user);
        return { ok: true };
      } else {
        return { ok: false, error: result.message || 'Erro ao fazer login' };
      }
    } catch (error: any) {
      console.error('Erro no signIn:', error);
      return { ok: false, error: error.message || 'Erro desconhecido' };
    }
  };

  /**
   * Registro de novo usuário
   */
  const signUp = async (
    username: string,
    email: string,
    password: string,
    fullName?: string,
    birthdateIso?: string,
    gender?: 'masculino' | 'feminino' | 'outro'
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await registerUser(username, email, password, fullName, birthdateIso, gender);

      if (result.ok && result.user) {
        setUser(result.user);
        return { ok: true };
      } else {
        return { ok: false, error: result.message || 'Erro ao criar conta' };
      }
    } catch (error: any) {
      console.error('Erro no signUp:', error);
      return { ok: false, error: error.message || 'Erro desconhecido' };
    }
  };

  /**
   * Logout
   */
  const signOut = async () => {
    try {
      // Limpar dados locais do AsyncStorage antes de fazer logout
      await clearLocalCheckups();
      
      // Fazer logout no Supabase
      await authSignOut();
      
      // Limpar estado do usuário
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  /**
   * Atualizar perfil do usuário
   */
  const refreshUser = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const profile = await getCurrentUser();
      if (isMountedRef.current) setUser(profile);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Valores do contexto
  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar o contexto de autenticação
 * 
 * @example
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth();
 * 
 * if (loading) return <LoadingScreen />;
 * if (!user) return <LoginScreen />;
 * return <HomeScreen />;
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};
