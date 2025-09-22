import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExplanationCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Explicabilidade & Disclaimer</Text>

      <Text style={styles.paragraph}>
        Explicabilidade (mock): a previsão apresentada é uma estimativa gerada por um modelo protótipo que considera sintomas selecionados e fatores climáticos. No protótipo as probabilidades são simuladas para demonstrar a interface.
      </Text>

      <Text style={[styles.paragraph, { fontWeight: '700' }]}>Aviso médico</Text>
      <Text style={styles.paragraph}>
        Este aplicativo é um protótipo educacional. As previsões não substituem a consulta com um profissional de saúde. Em caso de sintomas graves ou persistentes, procure atendimento médico.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#e9c46a',
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12,
    color: '#5559ff',
  },
  paragraph: { 
    color: '#444', 
    lineHeight: 22, 
    marginBottom: 12,
    fontSize: 14,
  },
});

export default ExplanationCard;