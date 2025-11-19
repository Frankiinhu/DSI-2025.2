/**
 * Tipos para o sistema de medicações
 */

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string; // Ex: "A cada 8 horas", "2x ao dia"
  times: string[]; // Array de horários ["08:00", "16:00", "22:00"]
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicationDTO {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  notes?: string;
  is_active?: boolean;
}

export interface UpdateMedicationDTO {
  name?: string;
  dosage?: string;
  frequency?: string;
  times?: string[];
  notes?: string;
  is_active?: boolean;
}

export interface MedicationResponse {
  ok: boolean;
  message?: string;
  data?: Medication | Medication[];
}
