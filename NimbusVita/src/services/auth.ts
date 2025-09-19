import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'nimbus_users';
const TOKEN_KEY = 'nimbus_token';

export type User = {
  email: string;
  password: string; // plain text as requested (no encryption)
};

export const registerUser = async (user: User): Promise<{ ok: boolean; message?: string }> => {
  try {
    console.log('Iniciando registro de usuário:', user.email);
    
    // Verificar se AsyncStorage está disponível
    if (!AsyncStorage) {
      console.error('AsyncStorage não está disponível');
      return { ok: false, message: 'Erro de configuração do armazenamento' };
    }

    const raw = await AsyncStorage.getItem(USERS_KEY);
    console.log('Dados existentes recuperados:', raw);
    
    const users: User[] = raw ? JSON.parse(raw) : [];
    console.log('Lista de usuários atual:', users.length);

    const exists = users.find(u => u.email === user.email);
    if (exists) {
      console.log('Usuário já existe:', user.email);
      return { ok: false, message: 'Usuário já existe' };
    }

    users.push(user);
    console.log('Salvando nova lista de usuários:', users.length);
    
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    console.log('Usuário registrado com sucesso');
    
    return { ok: true };
  } catch (e) {
    console.error('Erro detalhado no registro:', e);
    return { ok: false, message: `Erro no armazenamento: ${String(e)}` };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ ok: boolean; message?: string }> => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = raw ? JSON.parse(raw) : [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { ok: false, message: 'Credenciais inválidas' };

    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({ email, ts: Date.now() }));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};

export const signOut = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const obj = JSON.parse(token);
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = raw ? JSON.parse(raw) : [];
    return users.find(u => u.email === obj.email) || null;
  } catch (e) {
    return null;
  }
};