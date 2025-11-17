/**
 * Checkup and Symptom-related TypeScript type definitions
 */

export interface SymptomData {
  id: string;
  name: string;
  severity: 'leve' | 'moderado' | 'grave';
  category?: string;
  description?: string;
}

export interface CheckupRecord {
  id: string;
  userId: string;
  symptoms: SymptomData[];
  date: string;
  notes?: string;
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  weatherConditions?: {
    temperature: number | null;
    humidity: number | null;
    uvIndex: number | null;
    airQuality: number | null;
  };
}

export interface SymptomCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  relatedDiseases: string[];
}

export interface CheckupFormData {
  selectedSymptoms: string[];
  severity: 'leve' | 'moderado' | 'grave';
  notes: string;
  date: Date;
}

export interface CheckupAnalysisResult {
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  riskPercentage: number;
  recommendations: string[];
  potentialDiseases: string[];
  shouldSeekDoctor: boolean;
}
