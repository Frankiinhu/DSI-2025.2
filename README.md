# NimbusVita - Aplicativo de Saúde Preventiva

![NimbusVita Logo](./NimbusVita/assets/logo.png)

## 📱 Sobre o Projeto

**NimbusVita** é um aplicativo mobile de saúde preventiva que correlaciona sintomas clínicos com condições climáticas para prever riscos de doenças. Utilizando React Native/Expo e Supabase, oferece uma experiência completa de monitoramento de saúde.

### ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura** via Supabase Auth
- 🩺 **Verificador de Sintomas** com algoritmo de predição inteligente
- ☁️ **Monitoramento Climático** em tempo real
- 📊 **Histórico Completo** de verificações
- 📈 **Estatísticas e Insights** de saúde
- 🔔 **Alertas Inteligentes** baseados em padrões
- 🌐 **Sincronização em Nuvem** com Supabase
- 📱 **Suporte iOS e Android**

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 16.x
- npm ou yarn
- Expo CLI
- Conta no Supabase (gratuita)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Frankiinhu/DSI-2025.2.git
   cd NimbusVita
   ```

2. **Execute o script de setup**
   
   **Windows (PowerShell):**
   ```powershell
   .\setup.ps1
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure o Supabase**
   
   a. Crie um projeto em [supabase.com](https://supabase.com)
   
   b. Copie suas credenciais para `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```
   
   c. Execute o schema SQL no Supabase SQL Editor:
   - Abra o SQL Editor no dashboard do Supabase
   - Cole o conteúdo de `supabase_schema.sql`
   - Execute o script

4. **Inicie o desenvolvimento**
   ```bash
   npm start
   ```

5. **Execute no dispositivo**
   - Escaneie o QR code com Expo Go (iOS/Android)
   - Ou pressione `a` para Android emulator
   - Ou pressione `i` para iOS simulator

---

## 📁 Estrutura do Projeto

```
NimbusVita/
├── src/
│   ├── screens/              # Telas do app
│   │   ├── Splash.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── tabs/
│   │       ├── HomeTab.tsx
│   │       ├── CheckupTab.tsx
│   │       ├── AlertsTab.tsx
│   │       └── ProfileTab.tsx
│   ├── components/           # Componentes reutilizáveis
│   │   ├── SymptomChecker.tsx
│   │   ├── WeatherCard.tsx
│   │   ├── RiskAnalysis.tsx
│   │   └── ...
│   ├── services/             # Lógica de negócio
│   │   ├── supabase/
│   │   │   ├── auth.service.ts
│   │   │   └── checkup.service.ts
│   │   └── auth.ts (legacy)
│   ├── config/               # Configurações
│   │   └── supabase.ts
│   ├── types/                # TypeScript types
│   │   └── database.types.ts
│   ├── contexts/             # React Context
│   └── utils/                # Funções auxiliares
├── assets/                   # Imagens, ícones, etc
├── supabase_schema.sql       # Schema do banco
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React Native** 0.76.5
- **Expo** SDK 54
- **TypeScript** 5.9.2
- **React Navigation** 7.x
- **Lottie** para animações

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime)
- **AsyncStorage** para cache local

### DevTools
- **ESLint** para linting
- **Prettier** para formatação
- **Jest** para testes (planejado)

---

## 📊 Banco de Dados

### Tabelas Principais

1. **profiles** - Perfis de usuários
2. **symptoms_catalog** - Catálogo de sintomas
3. **symptom_checkups** - Verificações de sintomas
4. **weather_history** - Histórico climático
5. **health_alerts** - Alertas de saúde
6. **user_conditions** - Condições pré-existentes

### Diagrama ER

```
profiles (1) ----< (N) symptom_checkups
profiles (1) ----< (N) user_conditions
profiles (1) ----< (N) health_alerts
symptoms_catalog (1) ----< (N) [referenciado em checkups]
```

---

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) habilitado
- ✅ Tokens JWT com refresh automático
- ✅ Criptografia de dados sensíveis
- ✅ Validação de inputs
- ✅ HTTPS obrigatório

---

## 📱 Funcionalidades Detalhadas

### 1. Verificador de Sintomas

- 60+ sintomas catalogados
- Categorização por sistema (respiratório, neurológico, etc)
- Severidade de 1-5
- Duração em horas
- Algoritmo de predição ponderado
- Resultados em tempo real

### 2. Monitoramento Climático

- Temperatura, umidade, pressão
- Índice UV
- Qualidade do ar
- Velocidade do vento
- Correlação com sintomas

### 3. Histórico e Estatísticas

- CRUD completo de verificações
- Filtros por período (hoje, 7 dias, 30 dias)
- Dias consecutivos
- Gráficos de evolução
- Exportação de relatórios

### 4. Alertas Inteligentes

- Sintomas severos detectados
- Padrões de sintomas
- Riscos climáticos
- Qualidade do ar crítica
- Surtos de doenças (planejado)

---

## 🧪 Testes

### Executar Testes

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

---

## 📦 Build para Produção

### Android

```bash
eas build --platform android --profile production
```

### iOS

```bash
eas build --platform ios --profile production
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📝 Convenções de Código

- Use TypeScript strict mode
- Siga ESLint rules
- Componentes em PascalCase
- Funções em camelCase
- Constantes em UPPER_SNAKE_CASE
- Commits semânticos (feat, fix, docs, etc)

---

## 🐛 Problemas Conhecidos

Consulte a [página de Issues](https://github.com/Frankiinhu/DSI-2025.2/issues) para problemas conhecidos e planejados.

---

## 📚 Documentação Adicional

- [Plano de Implementação](./IMPLEMENTATION_PLAN.md)
- [Schema do Banco](./supabase_schema.sql)
- [Tipos TypeScript](./src/types/database.types.ts)

---

## 👥 Equipe

- **Desenvolvimento:** [Seu Nome]
- **Design:** [Designer]
- **Consultoria Médica:** [Consultor]

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

- **Email:** contato@nimbusvita.com
- **Website:** [nimbusvita.com](https://nimbusvita.com)
- **GitHub:** [github.com/Frankiinhu/DSI-2025.2](https://github.com/Frankiinhu/DSI-2025.2)

---

## 🙏 Agradecimentos

- Expo Team
- Supabase Team
- React Native Community
- Material Icons
- Lottie Animations

---

## ⚠️ Disclaimer

**IMPORTANTE:** Este aplicativo é um protótipo educacional. As predições são simuladas e **NÃO substituem** consulta médica profissional. Em caso de sintomas graves ou persistentes, **procure atendimento médico imediatamente**.

---

**Desenvolvido com ❤️ para promover saúde preventiva**
