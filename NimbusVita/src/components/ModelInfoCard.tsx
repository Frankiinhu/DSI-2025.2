import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../styles';
import type { PredictionResponse } from '../services/ml.service';

interface ModelInfo {
  model_name: string;
  model_type: string;
  version: string;
  accuracy: number;
  balanced_accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  feature_count: number;
  classes: string[];
  best_params: Record<string, any>;
}

interface FeatureImportance {
  feature_name: string;
  importance_value: number;
  rank: number;
}

interface ModelInfoCardProps {
  predictionData?: PredictionResponse | null;
}

export const ModelInfoCard: React.FC<ModelInfoCardProps> = ({ predictionData }) => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelInfo();
  }, [predictionData]); // Recarregar quando predictionData mudar

  const loadModelInfo = async () => {
    try {
      // Informações gerais do modelo (podem vir do Supabase)
      setModelInfo({
        model_name: 'Classificador de Doenças Respiratórias',
        model_type: 'RandomForest',
        version: '1.0.0',
        accuracy: 0.9250,
        balanced_accuracy: 0.9180,
        precision_macro: 0.9200,
        recall_macro: 0.9150,
        f1_macro: 0.9175,
        feature_count: 50,
        classes: ['Dengue', 'Gripe', 'Resfriado', 'Alergia', 'COVID-19', 'Sinusite'],
        best_params: {
          n_estimators: 200,
          max_depth: 'null',
          min_samples_split: 2,
          min_samples_leaf: 1,
        },
      });

      // Se temos predictionData com SHAP, usar as features desse checkup específico
      if (predictionData && predictionData.diagnoses && predictionData.diagnoses.length > 0) {
        const topDiagnosis = predictionData.diagnoses[0];
        const explanations = topDiagnosis.explanations || [];
        
        if (explanations.length > 0) {
          // Converter explicações SHAP em feature importance
          // Ordenar por impacto absoluto (mais importantes primeiro)
          const featuresFromShap = explanations
            .map((exp, idx) => ({
              feature_name: exp.feature,
              importance_value: Math.abs(exp.impact),
              rank: idx + 1
            }))
            .sort((a, b) => b.importance_value - a.importance_value)
            .slice(0, 8); // Top 8
          
          setFeatureImportance(featuresFromShap);
          return;
        }
      }

      // Fallback: features gerais do modelo (se não houver SHAP específico)
      setFeatureImportance([
        { feature_name: 'Febre Alta', importance_value: 0.145, rank: 1 },
        { feature_name: 'Dor nas Articulações', importance_value: 0.128, rank: 2 },
        { feature_name: 'Dor de Cabeça', importance_value: 0.112, rank: 3 },
        { feature_name: 'Fadiga', importance_value: 0.098, rank: 4 },
        { feature_name: 'Tosse', importance_value: 0.087, rank: 5 },
        { feature_name: 'Dor de Garganta', importance_value: 0.076, rank: 6 },
        { feature_name: 'Náusea', importance_value: 0.065, rank: 7 },
        { feature_name: 'Coriza', importance_value: 0.054, rank: 8 },
      ]);
    } catch (error) {
      console.error('Erro ao carregar informações do modelo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando informações do modelo...</Text>
      </View>
    );
  }

  if (!modelInfo) {
    return null;
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="analytics" size={28} color={Colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Informações do Modelo</Text>
          <Text style={styles.subtitle}>Classificação com SHAP</Text>
        </View>
      </View>

      {/* Model Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="model-training" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Detalhes do Modelo</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nome:</Text>
          <Text style={styles.infoValue}>{modelInfo.model_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo:</Text>
          <Text style={styles.infoValue}>{modelInfo.model_type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versão:</Text>
          <Text style={styles.infoValue}>{modelInfo.version}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Features:</Text>
          <Text style={styles.infoValue}>{modelInfo.feature_count}</Text>
        </View>
      </View>

      {/* Métricas de Performance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="assessment" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Métricas de Performance</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPercentage(modelInfo.accuracy)}</Text>
            <Text style={styles.metricLabel}>Acurácia</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPercentage(modelInfo.balanced_accuracy)}</Text>
            <Text style={styles.metricLabel}>Acurácia Balanceada</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPercentage(modelInfo.precision_macro)}</Text>
            <Text style={styles.metricLabel}>Precisão</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPercentage(modelInfo.recall_macro)}</Text>
            <Text style={styles.metricLabel}>Recall</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPercentage(modelInfo.f1_macro)}</Text>
            <Text style={styles.metricLabel}>F1-Score</Text>
          </View>
        </View>
      </View>

      {/* Classes Disponíveis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="category" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Classes Disponíveis</Text>
        </View>
        <View style={styles.classesContainer}>
          {modelInfo.classes.map((className, index) => (
            <View key={index} style={styles.classChip}>
              <Text style={styles.classChipText}>{className}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feature Importance (Top 8) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="bar-chart" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>
            {predictionData ? 'Features mais Importantes neste Checkup' : 'Top 8 Features Mais Importantes'}
          </Text>
        </View>
        
        {predictionData && (
          <Text style={styles.featureExplanation}>
            Baseado nos valores SHAP desta análise específica (idade, gênero, temperatura, umidade, vento + sintomas)
          </Text>
        )}
        
        <View style={styles.featureList}>
          {featureImportance.map((feature) => {
            const percentage = feature.importance_value * 100;
            return (
              <View key={feature.rank} style={styles.featureRow}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureRank}>#{feature.rank}</Text>
                  <Text style={styles.featureName}>{feature.feature_name}</Text>
                </View>
                <View style={styles.featureBarContainer}>
                  <View 
                    style={[
                      styles.featureBar,
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.featureValue}>
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Hiperparâmetros */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="tune" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Hiperparâmetros</Text>
        </View>
        
        {Object.entries(modelInfo.best_params).map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{key}:</Text>
            <Text style={styles.infoValue}>{String(value)}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          Este modelo foi treinado com dados sintéticos para fins educacionais. 
          As predições não substituem diagnóstico médico profissional.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  headerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  metricValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  classesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  classChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  classChipText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  featureList: {
    gap: Spacing.md,
  },
  featureExplanation: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  featureRow: {
    marginBottom: Spacing.sm,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureRank: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: Spacing.sm,
    width: 30,
  },
  featureName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  featureBarContainer: {
    height: 20,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: 4,
  },
  featureBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  featureValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
});
