import { supabase } from '../../config/supabase';
import {
  HealthLocation,
  CreateHealthLocationDTO,
  UpdateHealthLocationDTO,
  HealthLocationFilters,
} from '../../types/health-location.types';
import { logger } from '../../utils/logger';

export interface HealthLocationResponse {
  ok: boolean;
  message?: string;
  data?: HealthLocation | HealthLocation[];
}

/**
 * Mapeia dados do banco para o formato TypeScript
 */
const mapFromDatabase = (dbRecord: any): HealthLocation => ({
  id: dbRecord.id,
  type: dbRecord.type,
  name: dbRecord.name,
  description: dbRecord.description,
  address: dbRecord.address,
  latitude: dbRecord.latitude,
  longitude: dbRecord.longitude,
  contact_phone: dbRecord.contact_phone,
  contact_email: dbRecord.contact_email,
  event_date: dbRecord.event_date,
  event_time: dbRecord.event_time,
  event_end_date: dbRecord.event_end_date,
  expires_at: dbRecord.expires_at,
  created_by: dbRecord.created_by,
  created_at: dbRecord.created_at,
  updated_at: dbRecord.updated_at,
  is_active: dbRecord.is_active,
});

/**
 * Calcula a data de expiração para eventos
 */
const calculateExpiresAt = (eventEndDate?: string): string | undefined => {
  if (!eventEndDate) return undefined;
  
  const endDate = new Date(eventEndDate);
  // Adiciona 1 dia para expirar no final do evento
  endDate.setDate(endDate.getDate() + 1);
  return endDate.toISOString();
};

/**
 * Cria um novo local de saúde (UBS ou Evento)
 */
export const createHealthLocation = async (
  dto: CreateHealthLocationDTO
): Promise<HealthLocationResponse> => {
  try {
    logger.info('🏥 Criando novo local de saúde...', { type: dto.type, name: dto.name });

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        message: 'Usuário não autenticado',
      };
    }

    // Prepara dados para inserção
    const insertData: any = {
      type: dto.type,
      name: dto.name,
      description: dto.description,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      contact_phone: dto.contact_phone,
      contact_email: dto.contact_email,
      created_by: user.id,
      is_active: true,
    };

    // Adiciona campos específicos para eventos
    if (dto.type === 'event') {
      insertData.event_date = dto.event_date;
      insertData.event_time = dto.event_time;
      insertData.event_end_date = dto.event_end_date;
      insertData.expires_at = calculateExpiresAt(dto.event_end_date);
    }

    const { data, error } = await supabase
      .from('health_locations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar local de saúde:', error);
      throw error;
    }

    logger.info('✅ Local de saúde criado com sucesso:', data.id);

    return {
      ok: true,
      message: 'Local de saúde criado com sucesso',
      data: mapFromDatabase(data),
    };
  } catch (error: any) {
    logger.error('❌ Erro ao criar local de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao criar local de saúde',
    };
  }
};

/**
 * Busca todos os locais de saúde com filtros opcionais
 */
export const getHealthLocations = async (
  filters?: HealthLocationFilters
): Promise<HealthLocationResponse> => {
  try {
    logger.info('📡 Buscando locais de saúde...', filters);

    let query = supabase
      .from('health_locations')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplica filtros
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Por padrão, não inclui eventos expirados
    if (!filters?.include_expired) {
      const now = new Date().toISOString();
      query = query.or(`type.eq.ubs,expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar locais de saúde:', error);
      throw error;
    }

    logger.info('✅ Locais de saúde encontrados:', data?.length || 0);

    return {
      ok: true,
      data: data?.map(mapFromDatabase) || [],
    };
  } catch (error: any) {
    logger.error('❌ Erro ao buscar locais de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar locais de saúde',
    };
  }
};

/**
 * Busca um local de saúde por ID
 */
export const getHealthLocationById = async (
  id: string
): Promise<HealthLocationResponse> => {
  try {
    logger.info('🔍 Buscando local de saúde:', id);

    const { data, error } = await supabase
      .from('health_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ Erro ao buscar local de saúde:', error);
      throw error;
    }

    if (!data) {
      return {
        ok: false,
        message: 'Local de saúde não encontrado',
      };
    }

    logger.info('✅ Local de saúde encontrado');

    return {
      ok: true,
      data: mapFromDatabase(data),
    };
  } catch (error: any) {
    logger.error('❌ Erro ao buscar local de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar local de saúde',
    };
  }
};

/**
 * Atualiza um local de saúde
 */
export const updateHealthLocation = async (
  id: string,
  dto: UpdateHealthLocationDTO
): Promise<HealthLocationResponse> => {
  try {
    logger.info('✏️ Atualizando local de saúde:', id);

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        message: 'Usuário não autenticado',
      };
    }

    const updateData: any = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    // Atualiza expires_at se event_end_date foi modificado
    if (dto.event_end_date !== undefined) {
      updateData.expires_at = calculateExpiresAt(dto.event_end_date);
    }

    const { data, error } = await supabase
      .from('health_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar local de saúde:', error);
      throw error;
    }

    logger.info('✅ Local de saúde atualizado com sucesso');

    return {
      ok: true,
      message: 'Local de saúde atualizado com sucesso',
      data: mapFromDatabase(data),
    };
  } catch (error: any) {
    logger.error('❌ Erro ao atualizar local de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar local de saúde',
    };
  }
};

/**
 * Desativa um local de saúde (soft delete)
 */
export const deactivateHealthLocation = async (
  id: string
): Promise<HealthLocationResponse> => {
  try {
    logger.info('🗑️ Desativando local de saúde:', id);

    const { data, error } = await supabase
      .from('health_locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao desativar local de saúde:', error);
      throw error;
    }

    logger.info('✅ Local de saúde desativado com sucesso');

    return {
      ok: true,
      message: 'Local de saúde desativado com sucesso',
      data: mapFromDatabase(data),
    };
  } catch (error: any) {
    logger.error('❌ Erro ao desativar local de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao desativar local de saúde',
    };
  }
};

/**
 * Deleta permanentemente um local de saúde
 */
export const deleteHealthLocation = async (
  id: string
): Promise<HealthLocationResponse> => {
  try {
    logger.info('🗑️ Deletando local de saúde:', id);

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        message: 'Usuário não autenticado',
      };
    }

    const { error } = await supabase
      .from('health_locations')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar local de saúde:', error);
      throw error;
    }

    logger.info('✅ Local de saúde deletado com sucesso');

    return {
      ok: true,
      message: 'Local de saúde deletado com sucesso',
    };
  } catch (error: any) {
    logger.error('❌ Erro ao deletar local de saúde:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao deletar local de saúde',
    };
  }
};

/**
 * Limpa eventos expirados (utilitário para manutenção)
 */
export const cleanExpiredEvents = async (): Promise<HealthLocationResponse> => {
  try {
    logger.info('🧹 Limpando eventos expirados...');

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('health_locations')
      .update({ is_active: false })
      .eq('type', 'event')
      .lt('expires_at', now)
      .eq('is_active', true)
      .select();

    if (error) {
      logger.error('❌ Erro ao limpar eventos expirados:', error);
      throw error;
    }

    logger.info('✅ Eventos expirados limpos:', data?.length || 0);

    return {
      ok: true,
      message: `${data?.length || 0} eventos expirados foram desativados`,
      data: data?.map(mapFromDatabase) || [],
    };
  } catch (error: any) {
    logger.error('❌ Erro ao limpar eventos expirados:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao limpar eventos expirados',
    };
  }
};
