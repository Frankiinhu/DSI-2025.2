/**
 * Tipos para localizações monitoradas pelo usuário
 */

export interface MonitoredLocation {
  id: string;
  user_id: string;
  city_name: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  is_primary: boolean; // Se é a localização principal (atual)
  nickname?: string; // Apelido opcional (ex: "Trabalho", "Casa dos pais")
  created_at: string;
  updated_at: string;
}

export interface CreateMonitoredLocationDTO {
  city_name: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  is_primary?: boolean;
  nickname?: string;
}

export interface UpdateMonitoredLocationDTO {
  city_name?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
  nickname?: string;
}

export interface MonitoredLocationResponse {
  ok: boolean;
  message?: string;
  data?: MonitoredLocation | MonitoredLocation[];
}
