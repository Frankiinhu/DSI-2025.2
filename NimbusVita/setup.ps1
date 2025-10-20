# Script de Setup do NimbusVita com Supabase (Windows)
# Execute: .\setup.ps1

Write-Host "🚀 Iniciando setup do NimbusVita..." -ForegroundColor Green

# Verificar Node.js
Write-Host "`nVerificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar Expo CLI
Write-Host "`nVerificando Expo CLI..." -ForegroundColor Yellow
try {
    expo --version | Out-Null
    Write-Host "✅ Expo CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "Instalando Expo CLI globalmente..." -ForegroundColor Yellow
    npm install -g expo-cli
}

# Instalar dependências
Write-Host "`nInstalando dependências do projeto..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# Criar arquivo .env se não existir
if (!(Test-Path .env)) {
    Write-Host "`nCriando arquivo .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Configure suas credenciais do Supabase em .env" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Arquivo .env já existe" -ForegroundColor Green
}

# Verificar configuração do Supabase
$envContent = Get-Content .env -Raw
if ($envContent -match "YOUR_SUPABASE_URL") {
    Write-Host "⚠️  ATENÇÃO: Configure o SUPABASE_URL no arquivo .env" -ForegroundColor Red
}
if ($envContent -match "YOUR_SUPABASE_ANON_KEY") {
    Write-Host "⚠️  ATENÇÃO: Configure o SUPABASE_ANON_KEY no arquivo .env" -ForegroundColor Red
}

# Criar diretórios necessários
Write-Host "`nCriando estrutura de diretórios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path src\contexts | Out-Null
New-Item -ItemType Directory -Force -Path src\hooks | Out-Null
New-Item -ItemType Directory -Force -Path src\utils | Out-Null
New-Item -ItemType Directory -Force -Path __tests__ | Out-Null
Write-Host "✅ Diretórios criados" -ForegroundColor Green

# Limpar cache
Write-Host "`nLimpando cache..." -ForegroundColor Yellow
npm cache clean --force
npx expo start --clear

Write-Host "`n✅ Setup concluído!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Configure suas credenciais do Supabase no arquivo .env"
Write-Host "2. Execute o script SQL (supabase_schema.sql) no Supabase SQL Editor"
Write-Host "3. Execute 'npm start' para iniciar o desenvolvimento"
Write-Host "`n📚 Documentação:" -ForegroundColor Yellow
Write-Host "- Leia IMPLEMENTATION_PLAN.md para guia completo"
Write-Host "- Consulte README.md para instruções gerais"
Write-Host ""
