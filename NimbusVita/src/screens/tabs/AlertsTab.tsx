import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertCard from '../../components/AlertCard';
import ExplanationCard from '../../components/ExplanationCard';
import { theme } from '../../theme';

const AlertsTab: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background.brand} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alertas de Saúde</Text>
          <Text style={styles.headerSubtitle}>Informações importantes sobre sua região</Text>
        </View>

        <View style={styles.container}>
          <AlertCard />
          <ExplanationCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background.accent,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.background.brand,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.inverse,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.text.inverse,
    opacity: 0.9,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
});

export default AlertsTab;