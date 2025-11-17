import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../styles';

interface RiskFactor {
  name: string;
  description: string;
  level: string;
  icon: string;
}

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  icon: string;
}

interface RiskAnalysisProps {
  riskPercentage: number;
  factors: RiskFactor[];
  recommendations: Recommendation[];
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = React.memo(({
  riskPercentage,
  factors,
  recommendations,
}) => {
  const getRiskColor = React.useCallback((percentage: number) => {
    if (percentage < 40) return '#7b7fff';
    if (percentage < 70) return '#e9c46a';
    return '#d4572a';
  }, []);

  const getLevelColor = React.useCallback((level: string) => {
    switch (level.toLowerCase()) {
      case 'baixo': return '#7b7fff';
      case 'moderado': case 'médio': case 'medio': return '#e9c46a';
      case 'alto': return '#d4572a';
      default: return '#9999b3';
    }
  }, []);

  const getPriorityColor = React.useCallback((priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alto': return '#d4572a';
      case 'importante': return '#e9c46a';
      case 'sugestão': case 'sugestao': return '#7b7fff';
      case 'positivo': return '#7b7fff';
      default: return '#9999b3';
    }
  }, []);

  const getRiskLevelText = React.useCallback((percentage: number) => {
    if (percentage < 30) return 'Baixo';
    if (percentage < 60) return 'Moderado';
    return 'Alto';
  }, []);

  return (
    <View>
      {/* Risk Analysis Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="warning" size={24} color={getRiskColor(riskPercentage)} />
          <Text style={[styles.cardTitle, { color: getRiskColor(riskPercentage) }]}>Análise de Risco</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(riskPercentage) + '20' }]}>
            <Text style={[styles.riskLevel, { color: getRiskColor(riskPercentage) }]}>
              Risco {getRiskLevelText(riskPercentage)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Nível de Risco</Text>
          <Text style={styles.progressPercentage}>{riskPercentage}%</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${riskPercentage}%`,
                  backgroundColor: getRiskColor(riskPercentage)
                }
              ]} 
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Fatores Analisados</Text>
        {factors.map((factor, index) => (
          <View key={index} style={styles.factorItem}>
            <MaterialIcons name={factor.icon as any} size={16} color={getLevelColor(factor.level)} />
            <View style={styles.factorContent}>
              <Text style={styles.factorName}>{factor.name}</Text>
              <Text style={styles.factorDescription}>{factor.description}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(factor.level) + '20' }]}>
              <Text style={[styles.levelText, { color: getLevelColor(factor.level) }]}>
                {factor.level}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.explanation}>
          Explicação: O risco é calculado analisando temperatura, umidade, pressão atmosférica, 
          qualidade do ar e radiação UV. Cada fator impacta diferentes sistemas do corpo humano.
        </Text>
      </View>

      {/* Recommendations Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="lightbulb" size={24} color={Colors.primary} />
          <Text style={styles.cardTitle}>Recomendações</Text>
        </View>

        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <MaterialIcons name={rec.icon as any} size={20} color={getPriorityColor(rec.priority)} />
            <View style={styles.recommendationContent}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <View style={[
                  styles.priorityBadge, 
                  { backgroundColor: getPriorityColor(rec.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText, 
                    { color: getPriorityColor(rec.priority) }
                  ]}>
                    {rec.priority}
                  </Text>
                </View>
              </View>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.personalizedTip}>
          <MaterialIcons name="person" size={16} color={Colors.primary} />
          <Text style={styles.personalizedTitle}>Dica Personalizada</Text>
          <Text style={styles.personalizedDescription}>
            Monitore como se sente e ajuste atividades conforme necessário.
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
    marginLeft: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factorContent: {
    flex: 1,
    marginLeft: 8,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  factorDescription: {
    fontSize: 12,
    color: '#666',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  personalizedTip: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  personalizedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
    marginBottom: 4,
  },
  personalizedDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default RiskAnalysis;