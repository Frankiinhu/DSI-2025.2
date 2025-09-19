import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Alert, TextInput, FlatList, ScrollView } from 'react-native';

const SYMPTOMS = {
  // Sintomas Gerais
  fever: '🌡️ Febre',
  high_fever: '🌡️ Febre alta',
  chills: '🥶 Calafrios',
  shivering: '🥶 Tremores',
  fatigue: '😴 Fadiga',
  weakness: '💪 Fraqueza',
  body_aches: '💥 Dores no corpo',
  
  // Sintomas Respiratórios
  cough: '😷 Tosse',
  sore_throat: '🗣️ Dor de garganta',
  runny_nose: '👃 Nariz escorrendo',
  sneezing: '🤧 Espirros',
  shortness_of_breath: '😮‍💨 Falta de ar',
  rapid_breathing: '💨 Respiração rápida',
  reduced_smell_and_taste: '👃 Perda de olfato e paladar',
  
  // Sintomas Neurológicos
  headache: '🧠 Dor de cabeça',
  severe_headache: '🧠 Dor de cabeça severa',
  throbbing_headache: '🧠 Dor de cabeça latejante',
  sinus_headache: '🧠 Dor de cabeça sinusal',
  dizziness: '😵‍💫 Tontura',
  confusion: '🤔 Confusão mental',
  pain_behind_the_eyes: '👁️ Dor atrás dos olhos',
  pain_behind_eyes: '👁️ Dor atrás dos olhos',
  trouble_seeing: '👁️ Problemas de visão',
  
  // Sintomas Gastrointestinais
  nausea: '🤢 Náusea',
  vomiting: '🤮 Vômito',
  abdominal_pain: '🤱 Dor abdominal',
  diarrhea: '🚽 Diarreia',
  
  // Sintomas Musculoesqueléticos
  joint_pain: '🦴 Dor nas articulações',
  back_pain: '🔙 Dor nas costas',
  knee_ache: '🦵 Dor no joelho',
  
  // Sintomas Cardiovasculares
  chest_pain: '💗 Dor no peito',
  rapid_heart_rate: '💓 Batimento cardíaco acelerado',
  
  // Sintomas Dermatológicos
  rashes: '🔴 Erupções cutâneas',
  skin_irritation: '🩹 Irritação da pele',
  itchiness: '😣 Coceira',
  
  // Outros Sintomas
  swollen_glands: '🦠 Glândulas inchadas',
  facial_pain: '😣 Dor facial',
  
  // Condições Pré-existentes
  asthma_history: '🫁 Histórico de asma',
  asthma: '🫁 Asma',
  high_cholesterol: '🧪 Colesterol alto',
  diabetes: '🩸 Diabetes',
  obesity: '⚖️ Obesidade',
  hiv_aids: '🩺 HIV/AIDS',
  nasal_polyps: '👃 Pólipos nasais',
  high_blood_pressure: '💉 Pressão alta',
};

const CONDITIONS = ['Dengue', 'Gripe', 'Resfriado', 'Alergia', 'COVID-19', 'Sinusite'];

const QUICK_SYMPTOMS = [
  'fever', 'headache', 'cough', 'sore_throat', 'fatigue', 'body_aches', 'runny_nose', 'nausea'
];

const randomFactor = () => Math.random() * 0.4 + 0.8; // 0.8 - 1.2

const SymptomChecker: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSymptoms = Object.entries(SYMPTOMS).filter(([key, value]) =>
    value.toLowerCase().includes(searchText.toLowerCase()) ||
    key.toLowerCase().includes(searchText.toLowerCase())
  );

  const addSymptom = (key: string) => {
    const newSelected = new Set(selectedSymptoms);
    newSelected.add(key);
    setSelectedSymptoms(newSelected);
    setSearchText('');
    setShowDropdown(false);
  };

  const removeSymptom = (key: string) => {
    const newSelected = new Set(selectedSymptoms);
    newSelected.delete(key);
    setSelectedSymptoms(newSelected);
  };

  const mockPredict = () => {
    const count = selectedSymptoms.size;
    if (count === 0) return Alert.alert('Atenção', 'Selecione pelo menos um sintoma para prever.');

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
    
    setPredictions(res);
  };

  const clearAll = () => {
    setSelectedSymptoms(new Set());
    setPredictions(null);
    setSearchText('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Verificador de Sintomas</Text>
      <Text style={styles.cardSubtitle}>Pesquise e selecione os sintomas observados</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar sintomas (ex: dor de cabeça, febre...)"
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
        style={[styles.predictBtn, selectedSymptoms.size === 0 && styles.predictBtnDisabled]}
        onPress={mockPredict}
        disabled={selectedSymptoms.size === 0}
      >
        <Text style={styles.predictBtnText}>
          {selectedSymptoms.size > 0 ? 'Analisar Sintomas' : 'Selecione sintomas para analisar'}
        </Text>
      </TouchableOpacity>

      {predictions && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Possíveis Condições</Text>
          <Text style={styles.resultsSubtitle}>
            Baseado em {selectedSymptoms.size} sintoma{selectedSymptoms.size > 1 ? 's' : ''} selecionado{selectedSymptoms.size > 1 ? 's' : ''}
          </Text>
          
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
            onPress={() => Alert.alert(
              'Como funciona a análise?', 
              `Esta análise considera ${selectedSymptoms.size} sintoma${selectedSymptoms.size > 1 ? 's' : ''} selecionado${selectedSymptoms.size > 1 ? 's' : ''} e utiliza um algoritmo que pondera a frequência de cada sintoma em diferentes condições médicas.\n\nIMPORTANTE: Este é um protótipo educacional. As probabilidades são simuladas e não substituem consulta médica profissional.`
            )}
          >
            <Text style={styles.explainBtnText}>ℹ️ Como foi calculado</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#2a9d8f',
    marginBottom: 4,
  },
  cardSubtitle: { 
    color: '#666', 
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
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
    color: '#2a9d8f',
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
    color: '#2a9d8f',
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#721c24',
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
    backgroundColor: '#e8f5f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a9d8f',
  },
  symptomChipText: {
    fontSize: 14,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  symptomChipRemove: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  predictBtn: {
    backgroundColor: '#2a9d8f',
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
    backgroundColor: '#e9ecef',
  },
  predictBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#2a9d8f',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
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
    color: '#2a9d8f',
  },
  barBg: { 
    height: 12, 
    backgroundColor: '#e9ecef', 
    borderRadius: 8, 
    overflow: 'hidden',
  },
  barFill: { 
    height: 12, 
    backgroundColor: '#2a9d8f',
    borderRadius: 8,
  },
  explainBtn: { 
    marginTop: 16, 
    backgroundColor: '#264653', 
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickContainer: {
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  quickSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickChipText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
});

export default SymptomChecker;