export type HealthLocationType = 'ubs' | 'event';

export interface HealthLocation {
  id: string;
  type: HealthLocationType;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_email?: string;
  
  // Para eventos temporários
  event_date?: string; // ISO date string
  event_time?: string; // HH:MM format
  event_end_date?: string; // ISO date string
  expires_at?: string; // ISO timestamp
  
  // Metadados
  created_by: string; // user_id
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateHealthLocationDTO {
  type: HealthLocationType;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_email?: string;
  event_date?: string;
  event_time?: string;
  event_end_date?: string;
}

export interface UpdateHealthLocationDTO {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  contact_email?: string;
  event_date?: string;
  event_time?: string;
  event_end_date?: string;
  is_active?: boolean;
}

export interface HealthLocationFilters {
  type?: HealthLocationType;
  is_active?: boolean;
  include_expired?: boolean;
}
