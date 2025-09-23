import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const USER_PREFIX = 'nimbus_user_';
const TOKEN_KEY = 'nimbus_token';
const USERNAME_INDEX_KEY = 'nimbus_usernames';

export type StoredUser = {
  username: string;
  email: string;
  passwordHash: string;
};

export type UserRegistration = {
  username: string;
  email: string;
  password: string;
};

export type PublicUser = {
  username: string;
  email: string;
};

type SessionToken = {
  email: string;
  ts: number;
};

type UsernameIndex = Record<string, string>;

const getUserKey = (email: string) => `${USER_PREFIX}${email}`;

const getUsernameIndex = async (): Promise<UsernameIndex> => {
  const rawIndex = await AsyncStorage.getItem(USERNAME_INDEX_KEY);
  return rawIndex ? JSON.parse(rawIndex) : {};
};

export const registerUser = async (
  user: UserRegistration
): Promise<{ ok: boolean; message?: string }> => {
  try {

    if (!user.username || !user.email || !user.password) {
      return { ok: false, message: 'Todos os campos são obrigatórios' };
    }

    console.log('Iniciando registro de usuário:', user.email, user.username);
    const userKey = getUserKey(user.email);

    const existingRaw = await AsyncStorage.getItem(userKey);
    if (existingRaw) {
      console.log('E-mail já existe:', user.email);
      return { ok: false, message: 'E-mail já cadastrado' };
    }

    const usernames = await getUsernameIndex();
    if (usernames[user.username]) {
      console.log('Username já existe:', user.username);
      return { ok: false, message: 'Nome de usuário já existe' };
    }

    // Hash da senha
    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      user.password
    );

    const newUser: StoredUser = {
      username: user.username,
      email: user.email,
      passwordHash: passwordHash,
    };

    usernames[user.username] = user.email;

    await Promise.all([
      AsyncStorage.setItem(userKey, JSON.stringify(newUser)),
      AsyncStorage.setItem(USERNAME_INDEX_KEY, JSON.stringify(usernames)),
    ]);

    console.log('Usuário registrado com sucesso');

    return { ok: true };
  } catch (e) {
    console.error('Erro detalhado no registro:', e);
    return { ok: false, message: `Erro no armazenamento: ${String(e)}` };
  }
};

export const loginUser = async (
  // 'loginInput' pode ser email ou username
  loginInput: string,
  password: string
): Promise<{ ok: boolean; message?: string }> => {
  try {
    let email: string;
    const isEmail = loginInput.includes('@');

    if (isEmail) {
      // Login com E-mail
      email = loginInput;
    } else {
      // Login com Username
      const username = loginInput;
      const usernames = await getUsernameIndex();
      const foundEmail = usernames[username];

      if (!foundEmail) {
        return { ok: false, message: 'Credenciais inválidas' };
      }
      email = foundEmail;
    }

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
      await signOut();
      return null;
    }

    const storedUser: StoredUser = JSON.parse(rawUser);
    return {
      username: storedUser.username,
      email: storedUser.email,
    };
  } catch (e) {
    console.error('Erro em getCurrentUser:', e);
    return null;
  }
};