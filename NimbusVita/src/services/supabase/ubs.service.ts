import { supabase } from '../../config/supabase';
import { UBSLocation } from '../../types/ubs.types';
import { logger } from '../../utils/logger';
import type { Database } from '../../types/database.types';

type DatabaseUBS = Database['public']['Tables']['ubs_locations']['Row'];

export interface UBSResponse {
  ok: boolean;
  message?: string;
  data?: UBSLocation[];
}

/**
 * Mapeia dados do banco para o formato TypeScript
 */
const mapUBSFromDatabase = (dbUBS: DatabaseUBS): UBSLocation => ({
  id: dbUBS.id,
  name: dbUBS.name,
  address: dbUBS.address,
  latitude: dbUBS.latitude,
  longitude: dbUBS.longitude,
  phone: dbUBS.phone,
  openingHours: dbUBS.opening_hours,
  services: dbUBS.services,
  district: dbUBS.district,
  cnes: dbUBS.cnes,
  rpa: dbUBS.rpa,
});

/**
 * Busca todas as UBS cadastradas
 */
export const getAllUBS = async (): Promise<UBSResponse> => {
  try {
    logger.info('Fetching all UBS locations from database');
    
    const { data, error } = await supabase
      .from('ubs_locations')
      .select('*')
      .order('name', { ascending: true });

    logger.debug('Supabase query response', { 
      hasData: !!data, 
      dataLength: data?.length, 
      hasError: !!error
    });

    if (error) {
      logger.error('Supabase error fetching UBS locations', { error });
      throw error;
    }

    if (!data || data.length === 0) {
      logger.warn('No UBS locations found in database');
      return {
        ok: true,
        data: [],
        message: 'Nenhuma UBS cadastrada'
      };
    }

    const mappedData = data.map(mapUBSFromDatabase);
    logger.info('UBS locations fetched successfully', { count: mappedData.length });

    return {
      ok: true,
      data: mappedData,
    };
  } catch (error) {
    logger.error('Error fetching UBS locations', { error });
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Erro ao buscar UBS',
      data: [],
    };
  }
};

/**
 * Busca UBS próximas a uma localização (raio em km)
 */
export const getNearbyUBS = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<UBSResponse> => {
  try {
    logger.info('Fetching nearby UBS locations', { latitude, longitude, radiusKm });
    
    const { data, error } = await supabase
      .from('ubs_locations')
      .select('*');

    if (error) {
      logger.error('Error querying UBS locations', { error });
      throw error;
    }

    // Filtra por distância manualmente (pode ser otimizado no banco)
    interface UBSWithDistance extends UBSLocation {
      distance: number;
    }
    
    const ubsWithDistance: UBSWithDistance[] = (data || []).map((ubs) => {
      const mappedUBS = mapUBSFromDatabase(ubs);
      const distance = calculateDistance(
        latitude,
        longitude,
        ubs.latitude,
        ubs.longitude
      );
      return { ...mappedUBS, distance };
    });

    const nearbyUBS = ubsWithDistance
      .filter((ubs) => ubs.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    logger.info('Nearby UBS locations found', { count: nearbyUBS.length, radiusKm });

    return {
      ok: true,
      data: nearbyUBS,
    };
  } catch (error) {
    logger.error('Error fetching nearby UBS locations', { error, latitude, longitude });
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Erro ao buscar UBS próximas',
      data: [],
    };
  }
};

/**
 * Adiciona uma nova UBS
 */
export const addUBS = async (ubs: Omit<UBSLocation, 'id'>): Promise<UBSResponse> => {
  try {
    const { data, error } = await supabase
      .from('ubs_locations')
      .insert({
        name: ubs.name,
        address: ubs.address,
        latitude: ubs.latitude,
        longitude: ubs.longitude,
        phone: ubs.phone,
        opening_hours: ubs.openingHours,
        services: ubs.services,
        district: ubs.district,
        cnes: ubs.cnes,
        rpa: ubs.rpa,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ok: true,
      message: 'UBS adicionada com sucesso!',
      data,
    };
  } catch (error: any) {
    console.error('Erro ao adicionar UBS:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao adicionar UBS',
    };
  }
};

/**
 * Atualiza uma UBS existente
 */
export const updateUBS = async (
  id: string,
  updates: Partial<UBSLocation>
): Promise<UBSResponse> => {
  try {
    const { data, error } = await supabase
      .from('ubs_locations')
      .update({
        name: updates.name,
        address: updates.address,
        latitude: updates.latitude,
        longitude: updates.longitude,
        phone: updates.phone,
        opening_hours: updates.openingHours,
        services: updates.services,
        district: updates.district,
        cnes: updates.cnes,
        rpa: updates.rpa,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ok: true,
      message: 'UBS atualizada com sucesso!',
      data,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar UBS:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar UBS',
    };
  }
};

/**
 * Remove uma UBS
 */
export const deleteUBS = async (id: string): Promise<UBSResponse> => {
  try {
    const { error } = await supabase
      .from('ubs_locations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      ok: true,
      message: 'UBS removida com sucesso!',
    };
  } catch (error: any) {
    console.error('Erro ao remover UBS:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao remover UBS',
    };
  }
};

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Busca o endereço a partir de coordenadas (geocoding reverso)
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<UBSResponse> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    const data = await response.json();

    if (data && data.display_name) {
      return {
        ok: true,
        data: {
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state,
          postcode: data.address?.postcode,
        },
      };
    }

    return {
      ok: false,
      message: 'Endereço não encontrado',
    };
  } catch (error: any) {
    console.error('Erro ao buscar endereço:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar endereço',
    };
  }
};
