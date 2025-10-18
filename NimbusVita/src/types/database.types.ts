// Tipos gerados a partir do schema Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string | null
          avatar_url: string | null
          age: number | null
          gender: string | null
          height: number | null
          weight: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_conditions: {
        Row: {
          id: string
          user_id: string
          condition_name: string
          diagnosed_date: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_name: string
          diagnosed_date?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_name?: string
          diagnosed_date?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      symptoms_catalog: {
        Row: {
          id: string
          symptom_key: string
          symptom_name: string
          category: string
          description: string | null
          severity_scale: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          symptom_key: string
          symptom_name: string
          category: string
          description?: string | null
          severity_scale?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          symptom_key?: string
          symptom_name?: string
          category?: string
          description?: string | null
          severity_scale?: number
          is_active?: boolean
          created_at?: string
        }
      }
      symptom_checkups: {
        Row: {
          id: string
          user_id: string
          checkup_date: string
          symptoms: Json
          predictions: Json
          weather_data: Json | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checkup_date?: string
          symptoms: Json
          predictions: Json
          weather_data?: Json | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          checkup_date?: string
          symptoms?: Json
          predictions?: Json
          weather_data?: Json | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_history: {
        Row: {
          id: string
          user_id: string | null
          recorded_at: string
          location_lat: number
          location_lng: number
          location_name: string | null
          temperature: number | null
          humidity: number | null
          pressure: number | null
          wind_speed: number | null
          uv_index: number | null
          air_quality: number | null
          weather_condition: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          recorded_at?: string
          location_lat: number
          location_lng: number
          location_name?: string | null
          temperature?: number | null
          humidity?: number | null
          pressure?: number | null
          wind_speed?: number | null
          uv_index?: number | null
          air_quality?: number | null
          weather_condition?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          recorded_at?: string
          location_lat?: number
          location_lng?: number
          location_name?: string | null
          temperature?: number | null
          humidity?: number | null
          pressure?: number | null
          wind_speed?: number | null
          uv_index?: number | null
          air_quality?: number | null
          weather_condition?: string | null
          raw_data?: Json | null
          created_at?: string
        }
      }
      health_alerts: {
        Row: {
          id: string
          user_id: string | null
          alert_type: string
          severity: string
          title: string
          message: string
          metadata: Json | null
          is_read: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          alert_type: string
          severity: string
          title: string
          message: string
          metadata?: Json | null
          is_read?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          alert_type?: string
          severity?: string
          title?: string
          message?: string
          metadata?: Json | null
          is_read?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares
export type SymptomInput = {
  symptom_key: string
  severity: number
  duration_hours?: number
}

export type PredictionResult = {
  [condition: string]: number
}

export type WeatherData = {
  temperature: number
  humidity: number
  pressure: number
  wind_speed: number
  uv_index: number
  air_quality: number
  condition: string
}

export type UserStats = {
  total_checkups: number
  checkups_today: number
  checkups_last_7_days: number
  consecutive_days: number
  unread_alerts: number
}
