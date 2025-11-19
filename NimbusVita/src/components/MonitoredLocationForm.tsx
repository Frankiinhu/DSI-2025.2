/**
 * Formulário para adicionar/editar localização monitorada
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import type { MonitoredLocation, CreateMonitoredLocationDTO } from '../types/monitored-location.types';

interface CityOption {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  display_name: string;
}

interface MonitoredLocationFormProps {
  location?: MonitoredLocation;
  onSubmit: (data: CreateMonitoredLocationDTO) => Promise<void>;
  onCancel: () => void;
}

const MonitoredLocationForm: React.FC<MonitoredLocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [searchingCities, setSearchingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [cityName, setCityName] = useState(location?.city_name || '');
  const [state, setState] = useState(location?.state || '');
  const [country, setCountry] = useState(location?.country || 'Brasil');
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '');
  const [nickname, setNickname] = useState(location?.nickname || '');
  const [isPrimary, setIsPrimary] = useState(location?.is_primary || false);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(false);

  // Busca cidades via Nominatim API
  const searchCities = async (query: string) => {
    if (query.length < 3) {
      setCityOptions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingCities(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=8&` +
        `countrycodes=br&` +
        `featuretype=city`
      );
      
      const data = await response.json();
      
      const cities: CityOption[] = data
        .filter((item: any) => item.address?.city || item.address?.town || item.address?.municipality)
        .map((item: any) => ({
          name: item.address?.city || item.address?.town || item.address?.municipality || item.name,
          state: item.address?.state || '',
          country: item.address?.country || 'Brasil',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name,
        }));

      setCityOptions(cities);
      setShowSuggestions(cities.length > 0);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setCityOptions([]);
    } finally {
      setSearchingCities(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    if (selectedCity) return;
    
    const timer = setTimeout(() => {
      searchCities(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCity = (city: CityOption) => {
    setCityName(city.name);
    setState(city.state);
    setCountry(city.country);
    setLatitude(city.lat.toString());
    setLongitude(city.lon.toString());
    setSearchQuery(city.name);
    setSelectedCity(true);
    setShowSuggestions(false);
    setCityOptions([]);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSelectedCity(false);
    if (!text) {
      setCityName('');
      setState('');
      setLatitude('');
      setLongitude('');
    }
  };

  const handleSubmit = async () => {
    if (!cityName.trim() || !country.trim() || !latitude || !longitude) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        city_name: cityName.trim(),
        state: state.trim() || undefined,
        country: country.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        nickname: nickname.trim() || undefined,
        is_primary: isPrimary,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = cityName.trim() && country.trim() && latitude && longitude;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {location ? 'Editar Localização' : 'Nova Localização'}
        </Text>
        <TouchableOpacity 
          onPress={onCancel} 
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.formScroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={true}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apelido (opcional)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Ex: Trabalho, Casa da família..."
              placeholderTextColor={Colors.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Buscar Cidade *</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Digite o nome da cidade..."
                placeholderTextColor={Colors.textLight}
                editable={!loading}
              />
              {searchingCities && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoader} />
              )}
            </View>
            
            {showSuggestions && cityOptions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={cityOptions}
                  keyExtractor={(item, index) => `${item.name}-${index}`}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectCity(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="location-city" size={20} color={Colors.primary} />
                      <View style={styles.suggestionText}>
                        <Text style={styles.suggestionCity}>{item.name}</Text>
                        <Text style={styles.suggestionDetails}>
                          {[item.state, item.country].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>

          {selectedCity && (
            <View style={styles.selectedCityInfo}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={styles.selectedCityText}>
                <Text style={styles.selectedCityName}>{cityName}</Text>
                <Text style={styles.selectedCityDetails}>
                  {[state, country].filter(Boolean).join(', ')} • {latitude}, {longitude}
                </Text>
              </View>
            </View>
          )}

        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.switchText}>Definir como localização principal</Text>
          </View>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
            thumbColor={isPrimary ? Colors.primary : Colors.textLight}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (!isFormValid || loading) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textWhite} />
            ) : (
              <Text style={styles.submitButtonText}>
                {location ? 'Atualizar' : 'Adicionar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  formScroll: {
    flex: 1,
  },
  form: {
    gap: Spacing.md,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
  },
  searchLoader: {
    marginLeft: Spacing.sm,
  },
  suggestionsContainer: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
    ...Shadows.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  suggestionCity: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  suggestionDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedCityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  selectedCityText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  selectedCityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  selectedCityDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  switchText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
    flexShrink: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
    ...Shadows.none,
  },
});

export default MonitoredLocationForm;
