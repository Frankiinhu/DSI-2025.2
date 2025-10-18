import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { registerUser, UserRegistration } from '../services/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type RegisterResponse = { ok: boolean; message?: string };

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'masculino' | 'feminino' | 'outro' | undefined>(undefined);

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password) {
      return Alert.alert('Erro', 'Preencha os campos obrigatórios');
    }
    if (password !== confirm) {
      return Alert.alert('Erro', 'As senhas não coincidem');
    }
    
    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Erro', 'Por favor, insira um email válido');
    }

    try {
      // Basic birthdate sanity check (not in the future)
      if (birthdate && birthdate > new Date()) {
        return Alert.alert('Erro', 'Data de nascimento inválida');
      }
      const userToRegister: UserRegistration = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        birthdate: birthdate ? birthdate.toISOString() : undefined,
        gender: gender,
      };
      
      console.log('Tentando registrar usuário:', { 
        username: userToRegister.username, 
        email: userToRegister.email, 
        password: '***' 
      });

      const res: RegisterResponse = await registerUser(userToRegister);
      
      console.log('Resposta do registro:', res);
      if (!res.ok) {
        return Alert.alert('Erro', res.message || 'Não foi possível registrar');
      }
      
      Alert.alert('Sucesso', 'Conta registrada. Faça login.');
      navigation.goBack(); // Volta para a tela de Login

    } catch (error) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro', `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Nome completo" 
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Nome de usuário" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Confirmar senha" 
        value={confirm} 
        onChangeText={setConfirm} 
        secureTextEntry 
      />
      
      <TouchableOpacity
        style={[styles.input, { justifyContent: 'center' }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: birthdate ? theme.text.inverse : theme.text.brand }}>
          {birthdate ? birthdate.toLocaleDateString() : 'Data de nascimento'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthdate ?? new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            // On Android the picker closes after selection; on iOS we keep it open when using spinner
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setBirthdate(selectedDate);
            }
            // For iOS when user dismisses without setting
            if (event.type === 'dismissed') {
              setShowDatePicker(false);
            }
          }}
        />
      )}

      {/* Gender selection */}
      <View style={styles.genderRow}>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'masculino' && styles.genderSelected]}
          onPress={() => setGender('masculino')}
        >
          <Text style={[styles.genderText, gender === 'masculino' && styles.genderTextSelected]}>Masculino</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'feminino' && styles.genderSelected]}
          onPress={() => setGender('feminino')}
        >
          <Text style={[styles.genderText, gender === 'feminino' && styles.genderTextSelected]}>Feminino</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'outro' && styles.genderSelected]}
          onPress={() => setGender('outro')}
        >
          <Text style={[styles.genderText, gender === 'outro' && styles.genderTextSelected]}>Outro</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')}>
        <MaterialIcons name="arrow-back-ios-new" size={24} color={theme.text.inverse}/>
      </TouchableOpacity>      
      
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>{'Cadastrar'}</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Modo de Demonstração: Os dados são salvos apenas neste dispositivo.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 30, 
    justifyContent: 'center', 
    backgroundColor: '#5559ff',
  },
  title: { 
    fontSize: 36,
    alignContent: 'center',
    textAlign: 'center', 
    color: "#fff", 
    fontWeight: '600', 
    marginBottom: 50
  },
  input: { 
    borderWidth: 2, 
    borderColor: theme.surface.primary,
    backgroundColor: theme.surface.primary, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12,
    color: theme.text.brand,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: 6, 
  },
  note: { 
    marginTop: 12, 
    fontSize: 12, 
    color: theme.colors.accent.main, 
    textAlign: 'center' 
  },
  registerButton: { 
    backgroundColor: theme.interactive.secondary, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: 6,  
  },
  registerButtonText: { 
    color: theme.text.inverse, 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  back: {
    color: theme.text.inverse,
    position: 'absolute', 
    padding: 8,
    borderRadius: 5,
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
  ,
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: theme.surface.primary,
  },
  genderSelected: {
    backgroundColor: theme.interactive.secondary,
    borderColor: theme.interactive.secondary,
  },
  genderText: {
    color: theme.text.brand,
    fontSize: 14,
  },
  genderTextSelected: {
    color: theme.text.inverse,
    fontWeight: '600',
  }
});

export default SignupScreen;