#!/bin/bash

# Script de Setup do NimbusVita com Supabase
# Execute: chmod +x setup.sh && ./setup.sh

echo "🚀 Iniciando setup do NimbusVita..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
echo -e "${YELLOW}Verificando Node.js...${NC}"
if ! command_exists node; then
  echo -e "${RED}❌ Node.js não encontrado. Instale em https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Verificar npm
if ! command_exists npm; then
  echo -e "${RED}❌ npm não encontrado${NC}"
  exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Verificar Expo CLI
echo -e "${YELLOW}Verificando Expo CLI...${NC}"
if ! command_exists expo; then
  echo -e "${YELLOW}Instalando Expo CLI globalmente...${NC}"
  npm install -g expo-cli
fi
echo -e "${GREEN}✅ Expo CLI instalado${NC}"

# Instalar dependências
echo -e "${YELLOW}Instalando dependências do projeto...${NC}"
npm install

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro ao instalar dependências${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
  echo -e "${YELLOW}Criando arquivo .env...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✅ Arquivo .env criado${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANTE: Configure suas credenciais do Supabase em .env${NC}"
else
  echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

# Verificar se Supabase está configurado
if grep -q "YOUR_SUPABASE_URL" .env; then
  echo -e "${RED}⚠️  ATENÇÃO: Configure o SUPABASE_URL no arquivo .env${NC}"
fi

if grep -q "YOUR_SUPABASE_ANON_KEY" .env; then
  echo -e "${RED}⚠️  ATENÇÃO: Configure o SUPABASE_ANON_KEY no arquivo .env${NC}"
fi

# Criar diretórios necessários
echo -e "${YELLOW}Criando estrutura de diretórios...${NC}"
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p __tests__
echo -e "${GREEN}✅ Diretórios criados${NC}"

# Limpar cache
echo -e "${YELLOW}Limpando cache...${NC}"
npm cache clean --force
npx expo start --clear

echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo "1. Configure suas credenciais do Supabase no arquivo .env"
echo "2. Execute o script SQL (supabase_schema.sql) no Supabase SQL Editor"
echo "3. Execute 'npm start' para iniciar o desenvolvimento"
echo ""
echo -e "${YELLOW}📚 Documentação:${NC}"
echo "- Leia IMPLEMENTATION_PLAN.md para guia completo"
echo "- Consulte README.md para instruções gerais"
echo ""
