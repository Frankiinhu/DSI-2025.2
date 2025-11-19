import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../styles';
import { MaterialIcons } from '@expo/vector-icons';
import { PredictionResponse } from '../services/ml.service';

export const ExplanationCard: React.FC<{ diagnosisResults: PredictionResponse }> = React.memo(({ diagnosisResults }) => {
  // Validação de segurança
  if (!diagnosisResults || !diagnosisResults.diagnoses || diagnosisResults.diagnoses.length === 0) {
    return null;
  }
  
  // Pegar o diagnóstico principal (maior probabilidade)
  const topDiagnosis = diagnosisResults.diagnoses[0];
  
  // Pegar explicações para o diagnóstico principal
  const explanations = topDiagnosis?.explanations || [];
  
  if (!explanations || explanations.length === 0) {
    return null; // Não renderiza se não houver explicações
  }
  
  // Helper para formatar nomes de features para Português
  const formatFeatureName = (feature: string): string => {
    const featureMap: Record<string, string> = {
      // Sintomas principais
      'Náusea': 'Náusea',
      'Dor nas Articulações': 'Dor nas Articulações',
      'Dor Abdominal': 'Dor Abdominal',
      'Febre Alta': 'Febre Alta',
      'Calafrios': 'Calafrios',
      'Fadiga': 'Fadiga',
      'Coriza': 'Coriza',
      'Dor Atrás dos Olhos': 'Dor Atrás dos Olhos',
      'Tontura': 'Tontura',
      'Dor de Cabeça': 'Dor de Cabeça',
      'Dor no Peito': 'Dor no Peito',
      'Vômito': 'Vômito',
      'Tosse': 'Tosse',
      'Tremores': 'Tremores',
      'Febre': 'Febre',
      'Dores no Corpo': 'Dores no Corpo',
      'Dor de Garganta': 'Dor de Garganta',
      'Espirros': 'Espirros',
      'Diarreia': 'Diarreia',
      'Fraqueza': 'Fraqueza',
      'Problemas de Visão': 'Problemas de Visão',
      
      // Condições pré-existentes
      'Histórico de Asma': 'Histórico de Asma',
      'Colesterol Alto': 'Colesterol Alto',
      'Diabetes': 'Diabetes',
      'Obesidade': 'Obesidade',
      'HIV/AIDS': 'HIV/AIDS',
      'Pólipos Nasais': 'Pólipos Nasais',
      'Asma': 'Asma',
      'Pressão Alta': 'Pressão Alta',
      
      // Sintomas avançados
      'Dor de Cabeça Severa': 'Dor de Cabeça Severa',
      'Respiração Acelerada': 'Respiração Acelerada',
      'Batimento Cardíaco Acelerado': 'Batimento Cardíaco Acelerado',
      'Glândulas Inchadas': 'Glândulas Inchadas',
      'Erupções Cutâneas': 'Erupções Cutâneas',
      'Dor de Cabeça Sinusal': 'Dor de Cabeça Sinusal',
      'Dor Facial': 'Dor Facial',
      'Falta de Ar': 'Falta de Ar',
      'Redução de Olfato e Paladar': 'Redução de Olfato e Paladar',
      'Irritação na Pele': 'Irritação na Pele',
      'Coceira': 'Coceira',
      'Dor de Cabeça Pulsante': 'Dor de Cabeça Pulsante',
      'Confusão Mental': 'Confusão Mental',
      'Dor nas Costas': 'Dor nas Costas',
      'Dor no Joelho': 'Dor no Joelho',
      
      // Features de contexto
      'Idade': 'Idade',
      'Gênero': 'Gênero',
      'Temperatura (°C)': 'Temperatura',
      'Umidade': 'Umidade',
      'Velocidade do Vento (km/h)': 'Velocidade do Vento',
    };
    
    return featureMap[feature] || feature;
  };
  
  // Calcular impacto máximo para escalonamento
  const maxImpact = Math.max(...explanations.map(e => Math.abs(e.impact)), 0.001);
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="insights" size={24} color={Colors.primary} />
        <Text style={styles.cardTitle}>Explicação da Predição (SHAP)</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Fatores que mais influenciaram o diagnóstico de <Text style={styles.bold}>{topDiagnosis.condition}</Text>:
      </Text>
      
      <View style={styles.explanationsContainer}>
        {explanations.map((exp, index) => {
          const percentage = Math.min((Math.abs(exp.impact) / maxImpact) * 100, 100);
          const isPositive = exp.impact > 0;
          const barWidth = Math.max(percentage, 5); // Mínimo 5% para visibilidade
          
          return (
            <View key={`${exp.feature}-${index}`} style={styles.explanationRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>{formatFeatureName(exp.feature)}</Text>
                <Text style={[
                  styles.impactLabel,
                  { color: isPositive ? '#e63946' : '#06d6a0' }
                ]}>
                  {isPositive ? '↑ Aumenta risco' : '↓ Diminui risco'}
                </Text>
              </View>
              
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      width: `${barWidth}%`,
                      backgroundColor: isPositive ? '#e63946' : '#06d6a0'
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.impactValue}>
                {Math.abs(exp.impact).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e63946' }]} />
          <Text style={styles.legendText}>Aumenta probabilidade</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#06d6a0' }]} />
          <Text style={styles.legendText}>Diminui probabilidade</Text>
        </View>
      </View>
      
      <View style={styles.disclaimer}>
        <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          Valores SHAP mostram o impacto de cada fator na predição. Esta análise é educacional e não substitui diagnóstico médico.
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    padding: Spacing.md, 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: { 
    ...Typography.h3,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontSize: 14,
  },
  bold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  explanationsContainer: {
    marginBottom: Spacing.md,
  },
  explanationRow: {
    marginBottom: Spacing.md,
  },
  featureInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  impactLabel: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  impactValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
    lineHeight: 18,
    fontSize: 12,
  },
});