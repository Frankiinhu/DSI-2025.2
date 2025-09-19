import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import CustomButton from '../components/CustomButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const storedPassword = await AsyncStorage.getItem(`user_${username}`);
      if (storedPassword === password) {
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro', 'Usuário ou senha incorretos');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível fazer login');
    }
  };

 return (
    <View style={styles.container}>
        <TextInput
        placeholder="Usuário"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        />
        <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        />
        <CustomButton title="Entrar" onPress={handleLogin} />
        <CustomButton
        title="Cadastrar"
        onPress={() => navigation.navigate('Register')}
        backgroundColor="#2196F3"
        />
    </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5 },
});

export default LoginScreen;
