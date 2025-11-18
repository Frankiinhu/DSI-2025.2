import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '../styles';
import { useNotifications } from '../config/notifications';
import { predictDiagnosis, checkMLApiHealth, convertApiResponseToResults } from '../services/ml.service';

const SYMPTOMS = {
  // Sintomas Gerais
  fever: 'Febre',
  high_fever: 'Febre alta',
  chills: 'Calafrios',
  shivering: 'Tremores',
  fatigue: 'Fadiga',
  weakness: 'Fraqueza',
  body_aches: 'Dores no corpo',
  
  // Sintomas Respiratórios
  cough: 'Tosse',
  sore_throat: 'Dor de garganta',
  runny_nose: 'Nariz escorrendo',
  sneezing: 'Espirros',
  shortness_of_breath: 'Falta de ar',
  rapid_breathing: 'Respiração rápida',
  reduced_smell_and_taste: 'Perda de olfato e paladar',
  
  // Sintomas Neurológicos
  headache: 'Dor de cabeça',
  severe_headache: 'Dor de cabeça severa',
  throbbing_headache: 'Dor de cabeça latejante',
  sinus_headache: 'Dor de cabeça sinusal',
  dizziness: 'Tontura',
  confusion: 'Confusão mental',
  pain_behind_the_eyes: 'Dor atrás dos olhos',
  pain_behind_eyes: 'Dor atrás dos olhos',
  trouble_seeing: 'Problemas de visão',
  
  // Sintomas Gastrointestinais
  nausea: 'Náusea',
  vomiting: 'Vômito',
  abdominal_pain: 'Dor abdominal',
  diarrhea: 'Diarreia',
  
  // Sintomas Musculoesqueléticos
  joint_pain: 'Dor nas articulações',
  back_pain: 'Dor nas costas',
  knee_ache: 'Dor no joelho',
  
  // Sintomas Cardiovasculares
  chest_pain: 'Dor no peito',
  rapid_heart_rate: 'Batimento cardíaco acelerado',
  
  // Sintomas Dermatológicos
  rashes: 'Erupções cutâneas',
  skin_irritation: 'Irritação da pele',
  itchiness: 'Coceira',
  
  // Outros Sintomas
  swollen_glands: 'Glândulas inchadas',
  facial_pain: 'Dor facial',
  
  // Condições Pré-existentes
  asthma_history: 'Histórico de asma',
  asthma: 'Asma',
  high_cholesterol: 'Colesterol alto',
  diabetes: 'Diabetes',
  obesity: 'Obesidade',
  hiv_aids: 'HIV/AIDS',
  nasal_polyps: 'Pólipos nasais',
  high_blood_pressure: 'Pressão alta',
};

const CONDITIONS = ['Dengue', 'Gripe', 'Resfriado', 'Alergia', 'COVID-19', 'Sinusite'];

const QUICK_SYMPTOMS = [
  'fever', 'headache', 'cough', 'sore_throat', 'fatigue', 'body_aches', 'runny_nose', 'nausea'
];

const randomFactor = () => Math.random() * 0.4 + 0.8; // 0.8 - 1.2

interface SymptomCheckerProps {
  onCheckupComplete?: (symptoms: string[], results: Record<string, number>) => void;
  preSelectedSymptoms?: string[];
  onClearRequest?: () => void; // Callback para quando limpar é solicitado
}

const SymptomChecker: React.FC<SymptomCheckerProps> = ({ 
  onCheckupComplete, 
  preSelectedSymptoms,
  onClearRequest 
}) => {

  const { notify } = useNotifications();
  const [searchText, setSearchText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Effect para definir sintomas pré-selecionados
  React.useEffect(() => {
    if (preSelectedSymptoms && preSelectedSymptoms.length > 0) {
      // Converter nomes dos sintomas de volta para chaves
      const symptomKeys = preSelectedSymptoms
        .map(symptomName => {
          const entry = Object.entries(SYMPTOMS).find(([_, value]) => value === symptomName);
          return entry ? entry[0] : null;
        })
        .filter(Boolean) as string[];
      
      setSelectedSymptoms(new Set(symptomKeys));
    }
  }, [preSelectedSymptoms]);

  const filteredSymptoms = useMemo(() => {
    if (!searchText) return [];
    const search = searchText.toLowerCase();
    return Object.entries(SYMPTOMS).filter(([key, value]) =>
      value.toLowerCase().includes(search) ||
      key.toLowerCase().includes(search)
    );
  }, [searchText]);

  const addSymptom = useCallback((key: string) => {
    const newSelected = new Set(selectedSymptoms);
    newSelected.add(key);
    setSelectedSymptoms(newSelected);
    setSearchText('');
    setShowDropdown(false);
  }, [selectedSymptoms]);

  const removeSymptom = useCallback((key: string) => {
    const newSelected = new Set(selectedSymptoms);
    newSelected.delete(key);
    setSelectedSymptoms(newSelected);
  }, [selectedSymptoms]);

  const mockPredict = useCallback(() => {
    const count = selectedSymptoms.size;
    
    const res: Record<string, number> = {};
    let sum = 0;
    
    CONDITIONS.forEach((condition, i) => {
      // Base score
      let score = (i + 1) * (1 + count * 0.2) * randomFactor();
      
      // Specific symptom combinations for each condition
      const symptomsArray = Array.from(selectedSymptoms);
      
      // COVID-19 indicators
      if (condition === 'COVID-19') {
        if (symptomsArray.includes('reduced_smell_and_taste')) score *= 3.0;
        if (symptomsArray.includes('fever') && symptomsArray.includes('cough')) score *= 1.8;
        if (symptomsArray.includes('shortness_of_breath')) score *= 1.6;
        if (symptomsArray.includes('fatigue') && symptomsArray.includes('body_aches')) score *= 1.4;
      }
      
      // Dengue indicators
      if (condition === 'Dengue') {
        if (symptomsArray.includes('high_fever') && symptomsArray.includes('pain_behind_the_eyes')) score *= 2.5;
        if (symptomsArray.includes('joint_pain') && symptomsArray.includes('headache')) score *= 1.8;
        if (symptomsArray.includes('rashes')) score *= 1.6;
        if (symptomsArray.includes('nausea') && symptomsArray.includes('vomiting')) score *= 1.4;
      }
      
      // Gripe indicators
      if (condition === 'Gripe') {
        if (symptomsArray.includes('fever') && symptomsArray.includes('body_aches')) score *= 1.9;
        if (symptomsArray.includes('cough') && symptomsArray.includes('sore_throat')) score *= 1.7;
        if (symptomsArray.includes('chills') && symptomsArray.includes('fatigue')) score *= 1.5;
        if (symptomsArray.includes('headache')) score *= 1.3;
      }
      
      // Resfriado indicators
      if (condition === 'Resfriado') {
        if (symptomsArray.includes('runny_nose') && symptomsArray.includes('sneezing')) score *= 2.0;
        if (symptomsArray.includes('sore_throat') && !symptomsArray.includes('fever')) score *= 1.8;
        if (symptomsArray.includes('cough') && symptomsArray.includes('runny_nose')) score *= 1.5;
        // Reduce score if high fever is present
        if (symptomsArray.includes('high_fever')) score *= 0.6;
      }
      
      // Alergia indicators
      if (condition === 'Alergia') {
        if (symptomsArray.includes('sneezing') && symptomsArray.includes('itchiness')) score *= 2.2;
        if (symptomsArray.includes('runny_nose') && symptomsArray.includes('skin_irritation')) score *= 1.8;
        if (symptomsArray.includes('rashes') && symptomsArray.includes('itchiness')) score *= 1.6;
        // Reduce score if fever is present
        if (symptomsArray.includes('fever') || symptomsArray.includes('high_fever')) score *= 0.4;
      }
      
      // Sinusite indicators
      if (condition === 'Sinusite') {
        if (symptomsArray.includes('sinus_headache') && symptomsArray.includes('facial_pain')) score *= 2.5;
        if (symptomsArray.includes('runny_nose') && symptomsArray.includes('sinus_headache')) score *= 1.8;
        if (symptomsArray.includes('reduced_smell_and_taste')) score *= 1.5;
      }

      res[condition] = Math.max(score, 1); // Ensure minimum score
      sum += res[condition];
    });

    // Normalize to percentage
    Object.keys(res).forEach(k => {
      res[k] = Math.round((res[k] / sum) * 100);
    });
    
    // Ensure total is 100% (handle rounding)
    const total = Object.values(res).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const highest = Object.keys(res).reduce((a, b) => res[a] > res[b] ? a : b);
      res[highest] += (100 - total);
    }
    
    return res;
  }, [selectedSymptoms]);

  const performPrediction = useCallback(async () => {
    const count = selectedSymptoms.size;
    if (count === 0) {
      notify('warning', {
        params: {
          title: 'Atenção',
          description: 'Selecione pelo menos um sintoma para prever.',
        },
      });
      return;
    }

    setIsLoadingPrediction(true);
    setUsingMockData(false);

    let results: Record<string, number> | null = null;
    
    try {
      // Tentar usar a API real primeiro
      const symptomsArray = Array.from(selectedSymptoms);
      const apiResponse = await predictDiagnosis(symptomsArray);
      results = convertApiResponseToResults(apiResponse);
      
      setPredictions(results);
      // API funcionou
      
    } catch (error) {
      // Fallback para mock se API falhar
      setUsingMockData(true);
      
      results = mockPredict();
      setPredictions(results);
      
      notify('info', {
        params: {
          title: 'Modo Offline',
          description: 'Usando predição local. Conecte à API para resultados mais precisos.',
        },
      });
    } finally {
      setIsLoadingPrediction(false);
    }
    
    // Chama a callback com os resultados obtidos
    if (onCheckupComplete && results) {
      const symptomsArray = Array.from(selectedSymptoms);
      const symptomsNames = symptomsArray.map(key => SYMPTOMS[key as keyof typeof SYMPTOMS]);
      onCheckupComplete(symptomsNames, results);
    }
  }, [selectedSymptoms, onCheckupComplete, notify, mockPredict]);

  const clearAll = useCallback(() => {
    setSelectedSymptoms(new Set());
    setPredictions(null);
    setSearchText('');
    
    // Notificar pai que limpeza foi solicitada (útil para resetar modo de edição)
    if (onClearRequest) {
      onClearRequest();
    }
  }, [onClearRequest]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Verificador de Sintomas</Text>
      <Text style={styles.cardSubtitle}>Pesquise e selecione os sintomas observados</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar sintomas (ex: tosse, febre...)"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setShowDropdown(text.length > 0);
          }}
          onFocus={() => setShowDropdown(searchText.length > 0)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => {
              setSearchText('');
              setShowDropdown(false);
            }}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown with filtered symptoms */}
      {showDropdown && filteredSymptoms.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {filteredSymptoms.slice(0, 8).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dropdownItem,
                  selectedSymptoms.has(key) && styles.dropdownItemSelected
                ]}
                onPress={() => addSymptom(key)}
                disabled={selectedSymptoms.has(key)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedSymptoms.has(key) && styles.dropdownItemTextSelected
                ]}>
                  {value}
                  {selectedSymptoms.has(key) && ' ✓'}
                </Text>
              </TouchableOpacity>
            ))}
            {filteredSymptoms.length > 8 && (
              <Text style={styles.moreResultsText}>
                +{filteredSymptoms.length - 8} mais resultados...
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Quick symptoms */}
      {selectedSymptoms.size === 0 && searchText.length === 0 && (
        <View style={styles.quickContainer}>
          <Text style={styles.quickTitle}>Sintomas mais comuns:</Text>
          <View style={styles.quickSymptoms}>
            {QUICK_SYMPTOMS.map(key => (
              <TouchableOpacity
                key={key}
                style={styles.quickChip}
                onPress={() => addSymptom(key)}
              >
                <Text style={styles.quickChipText}>{SYMPTOMS[key as keyof typeof SYMPTOMS]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Selected symptoms */}
      {selectedSymptoms.size > 0 && (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>Sintomas selecionados ({selectedSymptoms.size})</Text>
            <TouchableOpacity onPress={clearAll} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Limpar todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.selectedSymptoms}>
            {Array.from(selectedSymptoms).map(key => (
              <TouchableOpacity
                key={key}
                style={styles.symptomChip}
                onPress={() => removeSymptom(key)}
              >
                <Text style={styles.symptomChipText}>{SYMPTOMS[key as keyof typeof SYMPTOMS]}</Text>
                <Text style={styles.symptomChipRemove}> ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.predictBtn, (selectedSymptoms.size === 0 || isLoadingPrediction) && styles.predictBtnDisabled]}
        onPress={performPrediction}
        disabled={selectedSymptoms.size === 0 || isLoadingPrediction}
      >
        {isLoadingPrediction ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.predictBtnText, { marginTop: 8, fontSize: 12 }]}>
              Primeira análise pode demorar até 1 min...
            </Text>
          </>
        ) : (
          <Text style={[
            styles.predictBtnText,
            selectedSymptoms.size === 0 && styles.predictBtnTextDisabled
          ]}>
            {selectedSymptoms.size > 0 ? 'Analisar Sintomas' : 'Selecione sintomas para analisar'}
          </Text>
        )}
      </TouchableOpacity>

      {predictions && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Possíveis Condições</Text>
          <Text style={styles.resultsSubtitle}>
            Baseado em {selectedSymptoms.size} sintoma{selectedSymptoms.size > 1 ? 's' : ''} selecionado{selectedSymptoms.size > 1 ? 's' : ''}
          </Text>
          {usingMockData && (
            <View style={styles.mockWarning}>
              <Text style={styles.mockWarningText}>⚠️ Modo Offline - Predição Local</Text>
            </View>
          )}
          
          {Object.entries(predictions)
            .sort(([,a], [,b]) => b - a)
            .map(([cond, pct]) => (
            <View key={cond} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultCondition}>{cond}</Text>
                <Text style={styles.resultPercentage}>{pct}%</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.explainBtn} 
            onPress={() => setShowInfoDialog(true)}
          >
            <Text style={styles.explainBtnText}>ⓘ Como foi calculado</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Dialog */}
      <Modal
        visible={showInfoDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoDialog(false)}
      >
        <View style={styles.infoDialogOverlay}>
          <View style={styles.infoDialogContainer}>
            <Text style={styles.infoDialogTitle}>Como funciona a análise?</Text>
            <Text style={styles.infoDialogMessage}>
              Esta análise considera {selectedSymptoms.size} sintoma{selectedSymptoms.size > 1 ? 's' : ''} selecionado{selectedSymptoms.size > 1 ? 's' : ''} e utiliza um algoritmo que pondera a frequência de cada sintoma em diferentes condições médicas.
              {'\n\n'}
              IMPORTANTE: Este é um protótipo educacional. As probabilidades são simuladas e não substituem consulta médica profissional.
            </Text>
            <TouchableOpacity
              style={styles.infoDialogButton}
              onPress={() => setShowInfoDialog(false)}
            >
              <Text style={styles.infoDialogButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderColor: '#e1dbeb',
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: { 
    color: '#666', 
    marginBottom: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e8f5f3',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  moreResultsText: {
    padding: 12,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  selectedContainer: {
    marginBottom: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff',
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#883b49ff',
    fontWeight: '600',
  },
  selectedSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7e0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1974bff',
  },
  symptomChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  symptomChipRemove: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  predictBtn: {
    color: "#fff",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictBtnDisabled: {
    backgroundColor: '#f5f0e1ff',
  },
  predictBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  predictBtnTextDisabled: {
    color: '#c2bba8',
  },
  resultsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  mockWarning: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  mockWarningText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  resultItem: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  barBg: { 
    height: 12, 
    backgroundColor: '#e9ecef', 
    borderRadius: 8, 
    overflow: 'hidden',
  },
  barFill: { 
    height: 12, 
    backgroundColor: '#e9c46a',
    borderRadius: 8,
  },
  explainBtn: { 
    marginTop: 16, 
    backgroundColor: '#e9c46a', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  explainBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickContainer: {
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  quickSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  quickChipText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  infoDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoDialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  infoDialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  infoDialogMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoDialogButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoDialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SymptomChecker;