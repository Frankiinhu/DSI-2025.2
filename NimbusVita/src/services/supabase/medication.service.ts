/**
 * Serviço para gerenciar medicações
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type {
  Medication,
  CreateMedicationDTO,
  UpdateMedicationDTO,
  MedicationResponse,
} from '../../types/medication.types';

/**
 * Busca todas as medicações do usuário
 */
export const getMedications = async (
  userId: string
): Promise<MedicationResponse> => {
  try {
    logger.info('Fetching user medications', { userId });

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching medications', { error, userId });
      throw error;
    }

    logger.info('Medications fetched successfully', { userId, count: data?.length || 0 });

    return {
      ok: true,
      data: data || [],
    };
  } catch (error) {
    logger.error('Failed to fetch medications', { error, userId });
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Erro ao buscar medicações',
    };
  }
};

/**
 * Cria uma nova medicação
 */
export const createMedication = async (
  userId: string,
  medicationData: CreateMedicationDTO
): Promise<MedicationResponse> => {
  try {
    logger.info('➕ Criando nova medicação...');

    const { data, error } = await supabase
      .from('medications')
      .insert({
        user_id: userId,
        ...medicationData,
        is_active: medicationData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Medicação criada com sucesso');

    return {
      ok: true,
      message: 'Medicação adicionada com sucesso',
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao criar medicação:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao criar medicação',
    };
  }
};

/**
 * Atualiza uma medicação existente
 */
export const updateMedication = async (
  medicationId: string,
  userId: string,
  updates: UpdateMedicationDTO
): Promise<MedicationResponse> => {
  try {
    logger.info('Updating medication', { medicationId, userId });

    const { data, error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', medicationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Medicação atualizada com sucesso');

    return {
      ok: true,
      message: 'Medicação atualizada com sucesso',
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao atualizar medicação:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar medicação',
    };
  }
};

/**
 * Deleta uma medicação
 */
export const deleteMedication = async (
  medicationId: string,
  userId: string
): Promise<MedicationResponse> => {
  try {
    logger.info('🗑️ Deletando medicação...');

    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', medicationId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info('✅ Medicação deletada com sucesso');

    return {
      ok: true,
      message: 'Medicação removida com sucesso',
    };
  } catch (error: any) {
    logger.error('❌ Erro ao deletar medicação:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao deletar medicação',
    };
  }
};

/**
 * Ativa/desativa uma medicação
 */
export const toggleMedicationStatus = async (
  medicationId: string,
  userId: string,
  isActive: boolean
): Promise<MedicationResponse> => {
  try {
    logger.info(`${isActive ? '✅' : '⏸️'} ${isActive ? 'Ativando' : 'Desativando'} medicação...`);

    const { data, error } = await supabase
      .from('medications')
      .update({ is_active: isActive })
      .eq('id', medicationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`✅ Medicação ${isActive ? 'ativada' : 'desativada'} com sucesso`);

    return {
      ok: true,
      message: `Medicação ${isActive ? 'ativada' : 'desativada'} com sucesso`,
      data,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao alterar status da medicação:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao alterar status da medicação',
    };
  }
};
