/**
 * Configuração da API de Machine Learning
 * 
 * IMPORTANTE: Se estiver testando em dispositivo físico (não emulador),
 * descomente e configure o IP da sua máquina aqui.
 */

// Para descobrir seu IP:
// Windows: ipconfig (procure IPv4 Address)
// Mac/Linux: ifconfig | grep "inet " (procure inet seguido do IP local)

// Exemplo: export const ML_API_HOST = '192.168.1.100';
export const ML_API_HOST = '192.168.0.16'; // undefined = usa configuração automática

export const ML_API_PORT = 8000;

// URL de produção do Render (atualizar após deploy)
export const ML_API_PRODUCTION_URL = 'https://nimbusvita-ml-api.onrender.com';
