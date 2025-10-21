import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../styles';
import { useNotifications } from '../config/notifications';

const AlertCard: React.FC = () => {
  const { notify } = useNotifications();
  const [enabled, setEnabled] = useState(false);
  const [mockNearbyRisk, setMockNearbyRisk] = useState<'Baixo' | 'Médio' | 'Alto'>('Baixo');

  const toggleEnable = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    if (newVal) {
      // simulate subscription to push/location alerts
      notify('success', {
        params: {
          title: 'Alertas ativados (simulado)',
          description: 'Você receberá alertas preventivos de acordo com sua localização (mock).',
        },
      });
    }
  };

  const sendTestPush = () => {
    // Here we mock a push notification flow: simple alert
    notify('info', {
      params: {
        title: 'Push (simulado)',
        description: `Alerta preventivo: risco ${mockNearbyRisk} na sua localidade.`,
      },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Alertas preventivos por localização</Text>
      <Text style={styles.cardSubtitle}>Receba avisos sobre riscos locais (chuvas, surtos, etc.)</Text>

      <View style={styles.row}>
        <Text>Ativar alertas</Text>
        <Switch value={enabled} onValueChange={toggleEnable} />
      </View>

      <View style={{ marginTop: 8 }}>
        <Text>Risco atual (mock): <Text style={{ fontWeight: '700' }}>{mockNearbyRisk.toUpperCase()}</Text></Text>
        <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setMockNearbyRisk('baixo')} style={styles.smallBtn}><Text>Baixo</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMockNearbyRisk('médio')} style={styles.smallBtn}><Text>Médio</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMockNearbyRisk('alto')} style={styles.smallBtn}><Text>Alto</Text></TouchableOpacity>
        </View>

        <TouchableOpacity onPress={sendTestPush} style={styles.pushBtn}>
          <Text style={{ color: '#fff' }}>Enviar push de teste (simulado)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: { 
    color: '#666', 
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallBtn: { 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pushBtn: { 
    marginTop: 16, 
    backgroundColor: Colors.primary, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default AlertCard;