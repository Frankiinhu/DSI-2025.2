/**
 * Serviço para gerenciar localizações monitoradas
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type {
  MonitoredLocation,
  CreateMonitoredLocationDTO,
  UpdateMonitoredLocationDTO,
  MonitoredLocationResponse,
} from '../../types/monitored-location.types';

/**
 * Busca todas as localizações monitoradas do usuário
 */
export const getMonitoredLocations = async (
  userId: string
): Promise<MonitoredLocationResponse> => {
  try {
    logger.info('Fetching monitored locations', { userId });

    const { data, error } = await supabase
      .from('monitored_locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching monitored locations', { error, userId });
      throw error;
    }

    logger.info('Monitored locations fetched successfully', { userId, count: data?.length || 0 });

    return {
      ok: true,
      data: data || [],
    };
  } catch (error) {
    logger.error('Failed to fetch monitored locations', { error, userId });
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Erro ao buscar localizações',
    };
  }
};

/**
 * Cria uma nova localização monitorada
 */
export const createMonitoredLocation = async (
  userId: string,
  locationData: CreateMonitoredLocationDTO
): Promise<MonitoredLocationResponse> => {
  try {
    logger.info('➕ Criando nova localização monitorada...');

    // Se está marcando como primary, remove o flag das outras
    if (locationData.is_primary) {
      await supabase
        .from('monitored_locations')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('monitored_locations')
      .insert({
        user_id: userId,
        ...locationData,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Localização criada com sucesso');

    return {
      ok: true,
      message: 'Localização adicionada com sucesso',
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao criar localização:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao criar localização',
    };
  }
};

/**
 * Atualiza uma localização monitorada
 */
export const updateMonitoredLocation = async (
  locationId: string,
  userId: string,
  updates: UpdateMonitoredLocationDTO
): Promise<MonitoredLocationResponse> => {
  try {
    logger.info('Updating monitored location', { locationId, userId });
    logger.info('✏️ Atualizando localização...');

    // Se está marcando como primary, remove o flag das outras
    if (updates.is_primary) {
      await supabase
        .from('monitored_locations')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .neq('id', locationId);
    }

    const { data, error } = await supabase
      .from('monitored_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Localização atualizada');

    return {
      ok: true,
      message: 'Localização atualizada com sucesso',
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao atualizar localização:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar localização',
    };
  }
};

/**
 * Deleta uma localização monitorada
 */
export const deleteMonitoredLocation = async (
  locationId: string,
  userId: string
): Promise<MonitoredLocationResponse> => {
  try {
    logger.info('🗑️ Deletando localização...');

    // Verifica se é a primary antes de deletar
    const { data: location } = await supabase
      .from('monitored_locations')
      .select('is_primary')
      .eq('id', locationId)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('monitored_locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', userId);

    if (error) throw error;

    // Se deletou a primary, marca a primeira como primary
    if (location?.is_primary) {
      const { data: remaining } = await supabase
        .from('monitored_locations')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase
          .from('monitored_locations')
          .update({ is_primary: true })
          .eq('id', remaining[0].id);
      }
    }

    logger.info('✅ Localização deletada');

    return {
      ok: true,
      message: 'Localização removida com sucesso',
    };
  } catch (error: any) {
    logger.error('❌ Erro ao deletar localização:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao deletar localização',
    };
  }
};

/**
 * Define uma localização como principal
 */
export const setPrimaryLocation = async (
  locationId: string,
  userId: string
): Promise<MonitoredLocationResponse> => {
  try {
    logger.info('⭐ Definindo localização principal...');

    // Remove o flag primary de todas
    await supabase
      .from('monitored_locations')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Define a selecionada como primary
    const { data, error } = await supabase
      .from('monitored_locations')
      .update({ is_primary: true })
      .eq('id', locationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Localização principal atualizada');

    return {
      ok: true,
      message: 'Localização principal atualizada',
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao definir localização principal:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao definir localização principal',
    };
  }
};
