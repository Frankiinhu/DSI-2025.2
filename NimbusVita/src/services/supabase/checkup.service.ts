import { supabase } from '../../config/supabase';
import { Database, SymptomInput, PredictionResult, WeatherData } from '../../types/database.types';

type SymptomCheckup = Database['public']['Tables']['symptom_checkups']['Row'];
type SymptomCheckupInsert = Database['public']['Tables']['symptom_checkups']['Insert'];
type SymptomCheckupUpdate = Database['public']['Tables']['symptom_checkups']['Update'];
type SymptomCatalog = Database['public']['Tables']['symptoms_catalog']['Row'];

export interface CheckupResponse {
  ok: boolean;
  message?: string;
  data?: SymptomCheckup | SymptomCheckup[];
}

export interface SymptomCatalogResponse {
  ok: boolean;
  message?: string;
  data?: SymptomCatalog[];
}

/**
 * CRUD - CREATE: Cria uma nova verificação de sintomas
 */
export const createCheckup = async (
  userId: string,
  symptoms: SymptomInput[],
  predictions: PredictionResult,
  weatherData?: WeatherData,
  locationData?: {
    lat: number;
    lng: number;
    name: string;
  },
  notes?: string
): Promise<CheckupResponse> => {
  try {
    if (!symptoms || symptoms.length === 0) {
      return { ok: false, message: 'Selecione pelo menos um sintoma' };
    }

    const checkupData: SymptomCheckupInsert = {
      user_id: userId,
      symptoms: symptoms as any,
      predictions: predictions as any,
      weather_data: weatherData as any,
      location_lat: locationData?.lat,
      location_lng: locationData?.lng,
      location_name: locationData?.name,
      notes,
    };

    const { data, error } = await supabase
      .from('symptom_checkups')
      .insert(checkupData)
      .select()
      .single();

    if (error) {
      console.error('Create checkup error:', error);
      return { ok: false, message: 'Erro ao salvar verificação' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Create checkup error:', error);
    return { ok: false, message: 'Erro inesperado ao criar verificação' };
  }
};

/**
 * CRUD - READ: Busca todas as verificações do usuário
 */
export const getCheckups = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<CheckupResponse> => {
  try {
    let query = supabase
      .from('symptom_checkups')
      .select('*')
      .eq('user_id', userId)
      .order('checkup_date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.startDate) {
      query = query.gte('checkup_date', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('checkup_date', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get checkups error:', error);
      return { ok: false, message: 'Erro ao buscar verificações' };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    console.error('Get checkups error:', error);
    return { ok: false, message: 'Erro inesperado ao buscar verificações' };
  }
};

/**
 * CRUD - READ: Busca uma verificação específica por ID
 */
export const getCheckupById = async (
  checkupId: string,
  userId: string
): Promise<CheckupResponse> => {
  try {
    const { data, error } = await supabase
      .from('symptom_checkups')
      .select('*')
      .eq('id', checkupId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get checkup error:', error);
      return { ok: false, message: 'Verificação não encontrada' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Get checkup error:', error);
    return { ok: false, message: 'Erro inesperado ao buscar verificação' };
  }
};

/**
 * CRUD - UPDATE: Atualiza uma verificação existente
 */
export const updateCheckup = async (
  checkupId: string,
  userId: string,
  updates: {
    symptoms?: SymptomInput[];
    predictions?: PredictionResult;
    weather_data?: WeatherData;
    notes?: string;
  }
): Promise<CheckupResponse> => {
  try {
    const updateData: SymptomCheckupUpdate = {
      symptoms: updates.symptoms as any,
      predictions: updates.predictions as any,
      weather_data: updates.weather_data as any,
      notes: updates.notes,
    };

    const { data, error } = await supabase
      .from('symptom_checkups')
      .update(updateData)
      .eq('id', checkupId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update checkup error:', error);
      return { ok: false, message: 'Erro ao atualizar verificação' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Update checkup error:', error);
    return { ok: false, message: 'Erro inesperado ao atualizar verificação' };
  }
};

/**
 * CRUD - DELETE: Remove uma verificação
 */
export const deleteCheckup = async (
  checkupId: string,
  userId: string
): Promise<CheckupResponse> => {
  try {
    const { error } = await supabase
      .from('symptom_checkups')
      .delete()
      .eq('id', checkupId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete checkup error:', error);
      return { ok: false, message: 'Erro ao excluir verificação' };
    }

    return { ok: true };
  } catch (error) {
    console.error('Delete checkup error:', error);
    return { ok: false, message: 'Erro inesperado ao excluir verificação' };
  }
};

/**
 * Busca verificações por período de tempo
 */
export const getCheckupsByPeriod = async (
  userId: string,
  period: 'today' | '7days' | '30days' | 'all'
): Promise<CheckupResponse> => {
  try {
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = undefined;
    }

    return getCheckups(userId, { startDate });
  } catch (error) {
    console.error('Get checkups by period error:', error);
    return { ok: false, message: 'Erro ao buscar verificações' };
  }
};

/**
 * Busca o catálogo de sintomas
 */
export const getSymptomsCatalog = async (): Promise<SymptomCatalogResponse> => {
  try {
    const { data, error } = await supabase
      .from('symptoms_catalog')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('symptom_name', { ascending: true });

    if (error) {
      console.error('Get symptoms catalog error:', error);
      return { ok: false, message: 'Erro ao buscar catálogo de sintomas' };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    console.error('Get symptoms catalog error:', error);
    return { ok: false, message: 'Erro inesperado ao buscar catálogo' };
  }
};

/**
 * Obtém estatísticas do usuário
 */
export const getUserStats = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Get user stats error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user stats error:', error);
    return null;
  }
};

/**
 * Calcula predições baseadas em sintomas (algoritmo melhorado)
 */
export const calculatePredictions = async (
  symptoms: SymptomInput[]
): Promise<PredictionResult> => {
  try {
    // Buscar informações dos sintomas do catálogo
    const symptomKeys = symptoms.map(s => s.symptom_key);
    
    const { data: catalogSymptoms } = await supabase
      .from('symptoms_catalog')
      .select('symptom_key, category, severity_scale')
      .in('symptom_key', symptomKeys);

    if (!catalogSymptoms || catalogSymptoms.length === 0) {
      throw new Error('Sintomas não encontrados no catálogo');
    }

    // Condições para análise
    const conditions = ['Dengue', 'Gripe', 'Resfriado', 'Alergia', 'COVID-19', 'Sinusite'];
    const scores: Record<string, number> = {};

    // Inicializar scores
    conditions.forEach(condition => {
      scores[condition] = 10; // Score base
    });

    // Processar cada sintoma
    symptoms.forEach(symptom => {
      const catalogSymptom = catalogSymptoms.find(cs => cs.symptom_key === symptom.symptom_key);
      if (!catalogSymptom) return;

      const severityMultiplier = symptom.severity || catalogSymptom.severity_scale;
      const durationMultiplier = symptom.duration_hours ? Math.min(symptom.duration_hours / 24, 3) : 1;

      // Pesos específicos por condição e sintoma
      switch (symptom.symptom_key) {
        // COVID-19
        case 'reduced_smell_and_taste':
          scores['COVID-19'] += 30 * severityMultiplier;
          scores['Sinusite'] += 10 * severityMultiplier;
          break;
        case 'shortness_of_breath':
          scores['COVID-19'] += 25 * severityMultiplier;
          scores['Gripe'] += 10 * severityMultiplier;
          break;
        case 'fever':
          if (symptoms.some(s => s.symptom_key === 'cough')) {
            scores['COVID-19'] += 20 * severityMultiplier;
            scores['Gripe'] += 18 * severityMultiplier;
          }
          scores['Dengue'] += 15 * severityMultiplier;
          break;

        // Dengue
        case 'high_fever':
          scores['Dengue'] += 25 * severityMultiplier;
          scores['Gripe'] += 15 * severityMultiplier;
          break;
        case 'pain_behind_eyes':
        case 'pain_behind_the_eyes':
          scores['Dengue'] += 30 * severityMultiplier;
          scores['Sinusite'] += 15 * severityMultiplier;
          break;
        case 'joint_pain':
          scores['Dengue'] += 20 * severityMultiplier;
          break;
        case 'rashes':
          scores['Dengue'] += 25 * severityMultiplier;
          scores['Alergia'] += 20 * severityMultiplier;
          break;

        // Gripe
        case 'body_aches':
          scores['Gripe'] += 20 * severityMultiplier;
          scores['Dengue'] += 15 * severityMultiplier;
          break;
        case 'chills':
          scores['Gripe'] += 18 * severityMultiplier;
          break;

        // Resfriado
        case 'runny_nose':
          scores['Resfriado'] += 25 * severityMultiplier;
          scores['Alergia'] += 20 * severityMultiplier;
          scores['Sinusite'] += 15 * severityMultiplier;
          break;
        case 'sneezing':
          scores['Resfriado'] += 20 * severityMultiplier;
          scores['Alergia'] += 25 * severityMultiplier;
          break;
        case 'sore_throat':
          scores['Resfriado'] += 18 * severityMultiplier;
          scores['Gripe'] += 15 * severityMultiplier;
          break;

        // Alergia
        case 'itchiness':
          scores['Alergia'] += 30 * severityMultiplier;
          break;
        case 'skin_irritation':
          scores['Alergia'] += 25 * severityMultiplier;
          break;

        // Sinusite
        case 'sinus_headache':
          scores['Sinusite'] += 35 * severityMultiplier;
          break;
        case 'facial_pain':
          scores['Sinusite'] += 30 * severityMultiplier;
          break;

        default:
          // Score genérico baseado na categoria
          if (catalogSymptom.category === 'Respiratório') {
            scores['COVID-19'] += 8 * severityMultiplier;
            scores['Gripe'] += 8 * severityMultiplier;
            scores['Resfriado'] += 8 * severityMultiplier;
          }
          break;
      }

      // Aplicar multiplicador de duração
      Object.keys(scores).forEach(condition => {
        scores[condition] *= (1 + (durationMultiplier - 1) * 0.3);
      });
    });

    // Penalizar condições improváveis
    // Alergia geralmente não tem febre
    if (symptoms.some(s => s.symptom_key === 'fever' || s.symptom_key === 'high_fever')) {
      scores['Alergia'] *= 0.3;
    }

    // Resfriado geralmente não tem febre alta
    if (symptoms.some(s => s.symptom_key === 'high_fever')) {
      scores['Resfriado'] *= 0.5;
    }

    // Normalizar para percentagens
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const percentages: PredictionResult = {};

    Object.keys(scores).forEach(condition => {
      percentages[condition] = Math.round((scores[condition] / totalScore) * 100);
    });

    // Garantir que soma seja 100%
    const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      const highest = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );
      percentages[highest] += 100 - sum;
    }

    return percentages;
  } catch (error) {
    console.error('Calculate predictions error:', error);
    // Retornar predições genéricas em caso de erro
    return {
      'COVID-19': 20,
      'Gripe': 20,
      'Resfriado': 20,
      'Dengue': 15,
      'Alergia': 15,
      'Sinusite': 10,
    };
  }
};
