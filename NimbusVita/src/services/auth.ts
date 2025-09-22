import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto'; 

const USER_PREFIX = 'nimbus_user_';
const TOKEN_KEY = 'nimbus_token';

// Hash salvo no AsyncStorage
export type StoredUser = {
  email: string;
  passwordHash: string;
};

export type UserRegistration = {
  email: string;
  password: string;
};

export type PublicUser = {
  email: string;
};

type SessionToken = {
  email: string;
  ts: number;
};

const getUserKey = (email: string) => `${USER_PREFIX}${email}`;

export const registerUser = async (
  user: UserRegistration
): Promise<{ ok: boolean; message?: string }> => {
  try {
    console.log('Iniciando registro de usuário:', user.email);
    const userKey = getUserKey(user.email);

    const existingRaw = await AsyncStorage.getItem(userKey);
    if (existingRaw) {
      console.log('Usuário já existe:', user.email);
      return { ok: false, message: 'Usuário já existe' };
    }

// Hash da senha
    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      user.password
    );

    const newUser: StoredUser = {
      email: user.email,
      passwordHash: passwordHash,
    };

    await AsyncStorage.setItem(userKey, JSON.stringify(newUser));
    console.log('Usuário registrado com sucesso');
    
    return { ok: true };
  } catch (e) {
    console.error('Erro detalhado no registro:', e);
    return { ok: false, message: `Erro no armazenamento: ${String(e)}` };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ ok: boolean; message?: string }> => {
  try {
    const userKey = getUserKey(email);

    const rawUser = await AsyncStorage.getItem(userKey);
    if (!rawUser) {
      return { ok: false, message: 'Credenciais inválidas' };
    }

    const storedUser: StoredUser = JSON.parse(rawUser);

    // Gerar o hash SHA-256
    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );

    if (storedUser.passwordHash !== inputHash) {
      return { ok: false, message: 'Credenciais inválidas' };
    }

    const token: SessionToken = { email: storedUser.email, ts: Date.now() };
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    
    return { ok: true };
  } catch (e) {
    console.error('Erro no login:', e);
    return { ok: false, message: String(e) };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Erro no signOut:', e);
  }
};

export const getCurrentUser = async (): Promise<PublicUser | null> => {
  try {
    const rawToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!rawToken) return null;

    const token: SessionToken = JSON.parse(rawToken);

    const userKey = getUserKey(token.email);
    const rawUser = await AsyncStorage.getItem(userKey);
    if (!rawUser) {
      // Token existe, mas usuário foi deletado. Limpar token órfão.
      await signOut();
      return null;
    }

    const storedUser: StoredUser = JSON.parse(rawUser);
    return {
      email: storedUser.email,
    };
  } catch (e) {
    console.error('Erro em getCurrentUser:', e);
    return null;
  }
};