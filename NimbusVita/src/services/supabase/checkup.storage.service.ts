/**
 * CHECKUP STORAGE SERVICE
 * Gerencia o armazenamento híbrido (AsyncStorage + Supabase)
 * Estratégia: Offline-First com sincronização automática
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { 
  createCheckup, 
  getCheckups, 
  deleteCheckup,
  updateCheckup
} from './checkup.service';
import { SymptomInput, PredictionResult, WeatherData } from '../../types/database.types';

const STORAGE_KEY = '@nimbusvita:checkups';
const PENDING_SYNC_KEY = '@nimbusvita:pending_sync';

export interface LocalCheckup {
  id: string;
  userId: string;
  date: string;
  symptoms: string[];
  results: Record<string, number>;
  timestamp: number;
  syncStatus: 'synced' | 'pending' | 'error';
  supabaseId?: string;
  error?: string;
}

export interface CheckupStorageResponse {
  ok: boolean;
  message?: string;
  checkups?: LocalCheckup[];
  checkup?: LocalCheckup;
}

/**
 * Verifica se há conexão com a internet
 */
const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

/**
 * Salva checkup localmente
 */
const saveLocalCheckup = async (checkup: LocalCheckup): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const checkups: LocalCheckup[] = stored ? JSON.parse(stored) : [];
    
    // Adicionar ou atualizar
    const index = checkups.findIndex(c => c.id === checkup.id);
    if (index >= 0) {
      checkups[index] = checkup;
    } else {
      checkups.unshift(checkup); // Adicionar no início
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkups));
  } catch (error) {
    console.error('Error saving local checkup:', error);
    throw error;
  }
};

/**
 * Busca checkups locais
 */
const getLocalCheckups = async (): Promise<LocalCheckup[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting local checkups:', error);
    return [];
  }
};

/**
 * Deleta checkup local
 */
const deleteLocalCheckup = async (id: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const checkups: LocalCheckup[] = stored ? JSON.parse(stored) : [];
    
    const filtered = checkups.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting local checkup:', error);
    throw error;
  }
};

/**
 * Adiciona checkup à fila de sincronização
 */
const addToPendingSync = async (checkup: LocalCheckup): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pending: LocalCheckup[] = stored ? JSON.parse(stored) : [];
    
    // Evitar duplicatas
    const exists = pending.some(c => c.id === checkup.id);
    if (!exists) {
      pending.push(checkup);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    }
  } catch (error) {
    console.error('Error adding to pending sync:', error);
  }
};

/**
 * Remove checkup da fila de sincronização
 */
const removeFromPendingSync = async (id: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pending: LocalCheckup[] = stored ? JSON.parse(stored) : [];
    
    const filtered = pending.filter(c => c.id !== id);
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from pending sync:', error);
  }
};

/**
 * Busca checkups pendentes de sincronização
 */
const getPendingSyncCheckups = async (): Promise<LocalCheckup[]> => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting pending sync checkups:', error);
    return [];
  }
};

/**
 * CRIAR CHECKUP (Offline-First)
 * 1. Salva localmente imediatamente
 * 2. Tenta sincronizar com Supabase
 * 3. Se offline, adiciona à fila de sincronização
 */
export const createCheckupOfflineFirst = async (
  userId: string,
  symptoms: string[],
  results: Record<string, number>,
  weatherData?: WeatherData,
  locationData?: { lat: number; lng: number; name: string },
  notes?: string
): Promise<CheckupStorageResponse> => {
  const localCheckup: LocalCheckup = {
    id: `local_${Date.now()}`,
    userId,
    date: new Date().toLocaleString('pt-BR'),
    symptoms,
    results,
    timestamp: Date.now(),
    syncStatus: 'pending',
  };

  try {
    // 1. Salvar localmente PRIMEIRO (rápido e sempre funciona)
    await saveLocalCheckup(localCheckup);
    console.log('✅ Checkup salvo localmente:', localCheckup.id);

    // 2. Tentar sincronizar com Supabase
    const online = await isOnline();
    
    if (online) {
      // Converter sintomas para formato Supabase
      const symptomsData: SymptomInput[] = symptoms.map(symptom => ({
        symptom_name: symptom,
        symptom_key: symptom.toLowerCase().replace(/\s+/g, '_'),
        severity: 1,
        duration_hours: 0
      }));

      const response = await createCheckup(
        userId,
        symptomsData,
        results,
        weatherData,
        locationData,
        notes
      );

      if (response.ok && response.data && !Array.isArray(response.data)) {
        // Sucesso! Atualizar com ID do Supabase
        localCheckup.supabaseId = response.data.id;
        localCheckup.syncStatus = 'synced';
        await saveLocalCheckup(localCheckup);
        console.log('✅ Checkup sincronizado com Supabase:', response.data.id);
      } else {
        throw new Error(response.message || 'Erro ao sincronizar');
      }
    } else {
      // Offline: adicionar à fila
      await addToPendingSync(localCheckup);
      console.log('📱 Offline: Checkup adicionado à fila de sincronização');
    }

    return { ok: true, checkup: localCheckup };
  } catch (error) {
    console.error('Error creating checkup:', error);
    
    // Mesmo com erro, o checkup está salvo localmente
    localCheckup.syncStatus = 'error';
    localCheckup.error = error instanceof Error ? error.message : 'Erro desconhecido';
    await saveLocalCheckup(localCheckup);
    await addToPendingSync(localCheckup);

    return { 
      ok: true, // Retorna true porque foi salvo localmente
      checkup: localCheckup,
      message: 'Salvo localmente. Será sincronizado quando houver conexão.'
    };
  }
};

/**
 * BUSCAR CHECKUPS (Cache-First)
 * Retorna dados locais imediatamente
 * Sincronização é feita apenas no startup do app (AuthContext)
 */
export const getCheckupsOfflineFirst = async (
  userId: string
): Promise<CheckupStorageResponse> => {
  try {
    // Buscar dados locais (rápido)
    const localCheckups = await getLocalCheckups();
    const userCheckups = localCheckups.filter(c => c.userId === userId);
    console.log(`📱 Carregados ${userCheckups.length} checkups locais`);

    return { ok: true, checkups: userCheckups };
  } catch (error) {
    console.error('Error getting checkups:', error);
    return { 
      ok: false, 
      message: 'Erro ao carregar checkups',
      checkups: [] 
    };
  }
};

/**
 * DELETAR CHECKUP (Offline-First)
 */
export const deleteCheckupOfflineFirst = async (
  checkupId: string,
  userId: string
): Promise<CheckupStorageResponse> => {
  try {
    // 1. Buscar supabaseId ANTES de deletar localmente
    const localCheckups = await getLocalCheckups();
    const checkup = localCheckups.find(c => c.id === checkupId);
    
    if (!checkup) {
      return { ok: false, message: 'Checkup não encontrado' };
    }

    // 2. Deletar localmente
    await deleteLocalCheckup(checkupId);
    console.log('✅ Checkup deletado localmente:', checkupId);

    // 3. Tentar deletar no Supabase
    const online = await isOnline();
    if (online && checkup.supabaseId) {
      const response = await deleteCheckup(checkup.supabaseId, userId);
      if (response.ok) {
        console.log('✅ Checkup deletado no Supabase:', checkup.supabaseId);
      } else {
        console.warn('⚠️ Erro ao deletar no Supabase, mas já foi deletado localmente');
      }
    }

    return { ok: true, message: 'Checkup deletado com sucesso' };
  } catch (error) {
    console.error('Error deleting checkup:', error);
    return { ok: false, message: 'Erro ao deletar checkup' };
  }
};

/**
 * ATUALIZAR CHECKUP (Offline-First)
 * Atualiza sintomas e resultados de um checkup existente
 */
export const updateCheckupOfflineFirst = async (
  checkupId: string,
  userId: string,
  symptoms: string[],
  results: Record<string, number>
): Promise<CheckupStorageResponse> => {
  console.log('🔍 updateCheckupOfflineFirst: Iniciando...');
  console.log('  - checkupId:', checkupId);
  console.log('  - userId:', userId);
  
  try {
    // 1. Buscar checkup local
    const localCheckups = await getLocalCheckups();
    console.log(`📱 Total de checkups locais: ${localCheckups.length}`);
    console.log(`📋 IDs disponíveis: ${localCheckups.map(c => c.id).join(', ')}`);
    
    const checkupIndex = localCheckups.findIndex(c => c.id === checkupId);
    
    if (checkupIndex === -1) {
      console.error(`❌ Checkup não encontrado! ID buscado: ${checkupId}`);
      console.error(`   IDs disponíveis: ${localCheckups.map(c => c.id).join(', ')}`);
      return { ok: false, message: 'Checkup não encontrado' };
    }

    console.log(`✅ Checkup encontrado no índice ${checkupIndex}`);
    const existingCheckup = localCheckups[checkupIndex];
    
    // 2. Atualizar dados localmente (mantém data e timestamp originais)
    const updatedCheckup: LocalCheckup = {
      ...existingCheckup,
      symptoms,
      results,
      // Mantém a data e timestamp originais - não altera quando foi criado
      syncStatus: 'pending',
    };

    localCheckups[checkupIndex] = updatedCheckup;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localCheckups));
    console.log('✅ Checkup atualizado localmente:', checkupId);

    // 3. Tentar atualizar no Supabase
    const online = await isOnline();
    if (online && existingCheckup.supabaseId) {
      try {
        // Converter sintomas para SymptomInput format
        const symptomInputs: SymptomInput[] = symptoms.map(name => ({
          symptom_key: name.toLowerCase().replace(/\s+/g, '_'),
          severity: 5
        }));

        const response = await updateCheckup(
          existingCheckup.supabaseId,
          userId,
          { 
            symptoms: symptomInputs,
            predictions: results as any
          }
        );
        
        if (response.ok) {
          updatedCheckup.syncStatus = 'synced';
          localCheckups[checkupIndex] = updatedCheckup;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localCheckups));
          console.log('✅ Checkup atualizado no Supabase:', existingCheckup.supabaseId);
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar atualização:', syncError);
        // Adicionar à fila de pendentes
        await addToPendingSync(updatedCheckup);
      }
    } else {
      // Offline: adicionar à fila
      await addToPendingSync(updatedCheckup);
      console.log('📱 Offline: Atualização adicionada à fila de sincronização');
    }

    return { 
      ok: true, 
      checkup: updatedCheckup,
      message: updatedCheckup.syncStatus === 'synced' 
        ? 'Checkup atualizado com sucesso'
        : 'Checkup atualizado localmente. Será sincronizado quando houver conexão.'
    };
  } catch (error) {
    console.error('Error updating checkup:', error);
    return { 
      ok: false, 
      message: error instanceof Error ? error.message : 'Erro ao atualizar checkup'
    };
  }
};

/**
 * SINCRONIZAR CHECKUPS EM BACKGROUND
 * Atualiza dados locais com dados do Supabase
 */
const syncCheckupsInBackground = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Iniciando sincronização em background...');
    
    // 1. Buscar checkups do Supabase
    const response = await getCheckups(userId);
    
    if (!response.ok || !response.data) {
      throw new Error(response.message || 'Erro ao buscar checkups');
    }

    const supabaseCheckups = Array.isArray(response.data) ? response.data : [response.data];
    
    // Primeiro, buscar checkups locais para preservar IDs
    const localCheckups = await getLocalCheckups();
    
    // Criar mapa de checkups locais por supabaseId
    const localBySupabaseId = new Map<string, LocalCheckup>();
    localCheckups.forEach(local => {
      if (local.supabaseId) {
        localBySupabaseId.set(local.supabaseId, local);
      }
    });
    
    // 2. Converter para formato local (PRESERVANDO ID LOCAL SE EXISTIR)
    const converted: LocalCheckup[] = supabaseCheckups.map((checkup: any) => {
      const existingLocal = localBySupabaseId.get(checkup.id);
      
      return {
        id: existingLocal?.id || `supabase_${checkup.id}`, // ✅ MANTÉM ID LOCAL
        userId: checkup.user_id,
        date: new Date(checkup.checkup_date).toLocaleString('pt-BR'),
        symptoms: Array.isArray(checkup.symptoms)
          ? checkup.symptoms.map((s: any) => s.symptom_name || s.symptom_key || s)
          : [],
        results: checkup.predictions || {},
        timestamp: new Date(checkup.checkup_date).getTime(),
        syncStatus: 'synced' as const,
        supabaseId: checkup.id,
      };
    });

    // 3. Filtrar locais pendentes que NÃO foram sincronizados ainda
    const pendingLocal = localCheckups.filter(c => 
      c.userId === userId && 
      c.syncStatus === 'pending' &&
      !c.supabaseId // Só incluir se ainda não tem ID do Supabase
    );

    const merged = [...pendingLocal, ...converted];
    
    // 4. Remover duplicatas (preferir versão sincronizada)
    const uniqueMap = new Map<string, LocalCheckup>();
    merged.forEach(checkup => {
      const key = checkup.supabaseId || checkup.id;
      const existing = uniqueMap.get(key);
      
      if (!existing || checkup.syncStatus === 'synced') {
        uniqueMap.set(key, checkup);
      }
    });

    const uniqueCheckups = Array.from(uniqueMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    // 5. Salvar versão mesclada
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueCheckups));
    console.log(`✅ Sincronização completa: ${uniqueCheckups.length} checkups`);
    
  } catch (error) {
    console.error('Background sync error:', error);
  }
};

/**
 * SINCRONIZAR CHECKUPS PENDENTES
 * Envia checkups pendentes para o Supabase
 */
export const syncPendingCheckups = async (): Promise<{
  synced: number;
  failed: number;
}> => {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('📱 Offline: Não é possível sincronizar agora');
      return { synced: 0, failed: 0 };
    }

    const pending = await getPendingSyncCheckups();
    console.log(`🔄 Sincronizando ${pending.length} checkups pendentes...`);

    let synced = 0;
    let failed = 0;

    for (const checkup of pending) {
      try {
        // Converter sintomas para formato Supabase
        const symptomsData: SymptomInput[] = checkup.symptoms.map(symptom => ({
          symptom_name: symptom,
          symptom_key: symptom.toLowerCase().replace(/\s+/g, '_'),
          severity: 1,
          duration_hours: 0
        }));

        const response = await createCheckup(
          checkup.userId,
          symptomsData,
          checkup.results
        );

        if (response.ok && response.data && !Array.isArray(response.data)) {
          // Sucesso! Atualizar local
          checkup.supabaseId = response.data.id;
          checkup.syncStatus = 'synced';
          await saveLocalCheckup(checkup);
          await removeFromPendingSync(checkup.id);
          synced++;
          console.log(`✅ Sincronizado: ${checkup.id} → ${response.data.id}`);
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${checkup.id}:`, error);
        failed++;
      }
    }

    console.log(`✅ Sincronização completa: ${synced} sucesso, ${failed} falhas`);
    return { synced, failed };
  } catch (error) {
    console.error('Error syncing pending checkups:', error);
    return { synced: 0, failed: 0 };
  }
};

/**
 * SINCRONIZAR CHECKUPS NO STARTUP
 * Puxa dados do Supabase quando o app é aberto
 * Combina com dados locais de forma inteligente
 */
export const syncCheckupsOnStartup = async (userId: string): Promise<void> => {
  try {
    console.log('🚀 Iniciando sincronização de startup...');
    
    // Verificar se está online
    const online = await isOnline();
    if (!online) {
      console.log('📱 Offline: Usando apenas dados locais');
      return;
    }

    // 1. Buscar dados do Supabase
    const response = await getCheckups(userId);
    
    if (!response.ok || !response.data) {
      console.warn('⚠️ Erro ao buscar dados do Supabase:', response.message);
      return;
    }

    const supabaseCheckups = Array.isArray(response.data) ? response.data : [response.data];
    console.log(`☁️ Encontrados ${supabaseCheckups.length} checkups no Supabase`);

    // Buscar dados locais PRIMEIRO para preservar IDs
    const localCheckups = await getLocalCheckups();
    const userLocalCheckups = localCheckups.filter(c => c.userId === userId);
    console.log(`📱 Encontrados ${userLocalCheckups.length} checkups locais`);
    
    // Criar mapa de checkups locais por supabaseId
    const localBySupabaseId = new Map<string, LocalCheckup>();
    userLocalCheckups.forEach(local => {
      if (local.supabaseId) {
        localBySupabaseId.set(local.supabaseId, local);
      }
    });

    // 2. Converter para formato local (PRESERVANDO ID LOCAL SE EXISTIR)
    const convertedCheckups: LocalCheckup[] = supabaseCheckups.map((checkup: any) => {
      const existingLocal = localBySupabaseId.get(checkup.id);
      
      return {
        id: existingLocal?.id || `supabase_${checkup.id}`, // ✅ MANTÉM ID LOCAL
        userId: checkup.user_id,
        date: new Date(checkup.checkup_date).toLocaleString('pt-BR'),
        symptoms: Array.isArray(checkup.symptoms)
          ? checkup.symptoms.map((s: any) => s.symptom_name || s.symptom_key || s)
          : [],
        results: checkup.predictions || {},
        timestamp: new Date(checkup.checkup_date).getTime(),
        syncStatus: 'synced' as const,
        supabaseId: checkup.id,
      };
    });

    // 4. Identificar checkups pendentes (não sincronizados)
    const pendingCheckups = userLocalCheckups.filter(c => 
      (c.syncStatus === 'pending' || c.syncStatus === 'error') &&
      !c.supabaseId // Só incluir se ainda não foi sincronizado
    );
    console.log(`⏳ ${pendingCheckups.length} checkups pendentes de sincronização`);

    // 5. Criar mapa de IDs do Supabase para evitar duplicatas
    const supabaseIds = new Set(convertedCheckups.map(c => c.supabaseId));

    // 6. Filtrar locais que já existem no Supabase (evitar duplicatas)
    const uniqueLocalCheckups = userLocalCheckups.filter(local => 
      !local.supabaseId || !supabaseIds.has(local.supabaseId)
    );

    // 7. Combinar: Supabase (fonte verdade) + Locais únicos/pendentes
    const mergedCheckups = [
      ...convertedCheckups,  // Dados do Supabase (prioridade)
      ...uniqueLocalCheckups // Dados locais únicos/pendentes
    ];

    // 8. Remover duplicatas finais por ID
    const finalCheckups = Array.from(
      new Map(mergedCheckups.map(c => [c.id, c])).values()
    );

    // 9. Salvar resultado mesclado
    const allCheckups = [
      ...localCheckups.filter(c => c.userId !== userId), // Manter outros usuários
      ...finalCheckups // Checkups do usuário atual mesclados
    ];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allCheckups));
    console.log(`✅ Sincronização de startup completa: ${finalCheckups.length} checkups salvos`);

    // 10. Tentar sincronizar pendentes em background
    if (pendingCheckups.length > 0) {
      console.log(`🔄 Sincronizando ${pendingCheckups.length} checkups pendentes...`);
      syncPendingCheckups().catch(err => 
        console.error('Erro ao sincronizar pendentes:', err)
      );
    }

  } catch (error) {
    console.error('❌ Erro na sincronização de startup:', error);
  }
};

/**
 * LIMPAR CACHE LOCAL
 * Remove todos os checkups locais (útil para logout)
 */
export const clearLocalCheckups = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(PENDING_SYNC_KEY);
    console.log('✅ Cache local limpo');
  } catch (error) {
    console.error('Error clearing local checkups:', error);
  }
};

/**
 * OBTER STATUS DE SINCRONIZAÇÃO
 */
export const getSyncStatus = async (): Promise<{
  total: number;
  synced: number;
  pending: number;
  error: number;
}> => {
  try {
    const checkups = await getLocalCheckups();
    
    return {
      total: checkups.length,
      synced: checkups.filter(c => c.syncStatus === 'synced').length,
      pending: checkups.filter(c => c.syncStatus === 'pending').length,
      error: checkups.filter(c => c.syncStatus === 'error').length,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return { total: 0, synced: 0, pending: 0, error: 0 };
  }
};
