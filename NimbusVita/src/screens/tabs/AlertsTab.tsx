import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertCard from '../../components/AlertCard';
import ExplanationCard from '../../components/ExplanationCard';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';

const AlertsTab: React.FC = () => {
  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AlertCard />
          <ExplanationCard />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.accent,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    ...ComponentStyles.cardSmall,
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.base,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  filterText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    ...Typography.labelSmall,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  emptyState: {
    ...ComponentStyles.emptyState,
  },
  emptyStateText: {
    ...ComponentStyles.emptyStateText,
  },
  emptyStateSubtext: {
    ...ComponentStyles.emptyStateSubtext,
  },
});

export default AlertsTab;