/**
 * Alert and Status-related TypeScript type definitions
 */

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success';

export type AlertType = 
  | 'weather'
  | 'health'
  | 'air_quality'
  | 'uv_index'
  | 'disease_outbreak'
  | 'system';

export interface AlertData {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
}

export interface StatusData {
  location: string;
  riskLevel: string;
  riskPercentage: number;
  description: string;
  lastUpdate: string;
}

export interface RiskFactor {
  name: string;
  value: number | string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description?: string;
}

export interface RiskAnalysis {
  overallRisk: 'baixo' | 'moderado' | 'alto' | 'crítico';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  timestamp: Date;
}
