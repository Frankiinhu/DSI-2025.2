import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '../../styles';
import { UBSLocation, MapRegion } from '../../types/ubs.types';
import { getAllUBS, getNearbyUBS } from '../../services/supabase/ubs.service';

const MapsTab = () => {
  const mapRef = useRef<MapView>(null);
  
  // Estados
  const [userLocation, setUserLocation] = useState<MapRegion | null>(null);
  const [ubsLocations, setUbsLocations] = useState<UBSLocation[]>([]);
  const [selectedUBS, setSelectedUBS] = useState<UBSLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);

  // Região inicial (Brasil - Recife como padrão)
  const defaultRegion: MapRegion = {
    latitude: -8.0476,
    longitude: -34.8770,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  useEffect(() => {
    requestLocationPermission();
    loadUBSLocations();
  }, []);

  /**
   * Carrega todas as UBS do banco de dados
   */
  const loadUBSLocations = async () => {
    console.log('🗺️ Carregando UBS...');
    const result = await getAllUBS();
    console.log('🗺️ Resultado da busca:', result);
    if (result.ok) {
      console.log('🗺️ UBS encontradas:', result.data?.length || 0);
      setUbsLocations(result.data || []);
    } else {
      console.error('❌ Erro ao carregar UBS:', result.message);
    }
  };

  /**
   * Solicita permissão de localização
   */
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        await getUserLocation();
      } else {
        Alert.alert(
          'Permissão Negada',
          'Permita o acesso à localização para ver UBS próximas a você.',
          [{ text: 'OK' }]
        );
        setUserLocation(defaultRegion);
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setUserLocation(defaultRegion);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtém a localização atual do usuário
   */
  const getUserLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion: MapRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setUserLocation(newRegion);
      setShowUserLocation(true);
      
      // Anima o mapa para a localização do usuário
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }

      // TODO: Aqui você pode calcular as distâncias das UBS
      calculateDistances(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLoadingLocation(false);
    }
  };

  /**
   * Calcula a distância entre duas coordenadas (fórmula de Haversine)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  /**
   * Calcula distâncias de todas as UBS em relação ao usuário
   */
  const calculateDistances = (userLat: number, userLon: number) => {
    const ubsWithDistances = ubsLocations.map((ubs) => ({
      ...ubs,
      distance: calculateDistance(userLat, userLon, ubs.latitude, ubs.longitude),
    }));

    // Ordena por distância
    ubsWithDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setUbsLocations(ubsWithDistances);
  };

  /**
   * Centraliza o mapa em uma UBS específica
   */
  const focusOnUBS = (ubs: UBSLocation) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: ubs.latitude,
          longitude: ubs.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
    setSelectedUBS(ubs);
  };

  /**
   * Abre o Google Maps com direções
   */
  const openDirections = (ubs: UBSLocation) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${ubs.latitude},${ubs.longitude}`;
    const label = encodeURIComponent(ubs.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  /**
   * Faz uma chamada telefônica
   */
  const makeCall = (phone: string) => {
    const phoneNumber = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation || defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Marcadores das UBS */}
        {ubsLocations.map((ubs) => (
          <Marker
            key={ubs.id}
            coordinate={{
              latitude: ubs.latitude,
              longitude: ubs.longitude,
            }}
            title={ubs.name}
            description={ubs.address}
            onPress={() => setSelectedUBS(ubs)}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons
                name="hospital-building"
                size={32}
                color={Colors.primary}
              />
            </View>
          </Marker>
        ))}

        {/* Círculo ao redor da localização do usuário (raio de 5km) */}
        {userLocation && showUserLocation && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={5000}
            strokeColor="rgba(0, 122, 255, 0.3)"
            fillColor="rgba(0, 122, 255, 0.1)"
          />
        )}
      </MapView>

      {/* Botões de controle */}
      <View style={styles.controlButtons}>
        {/* Botão de localização */}
        <TouchableOpacity
          style={[styles.controlButton, loadingLocation && styles.controlButtonDisabled]}
          onPress={getUserLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="locate" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>

        {/* Botão de lista */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            // TODO: Mostrar lista de UBS
          }}
        >
          <Ionicons name="list" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Card de informações da UBS selecionada */}
      {selectedUBS && (
        <View style={styles.ubsCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.ubsHeader}>
              <MaterialCommunityIcons
                name="hospital-building"
                size={40}
                color={Colors.primary}
              />
              <View style={styles.ubsHeaderText}>
                <Text style={styles.ubsName}>{selectedUBS.name}</Text>
                {selectedUBS.distance && (
                  <Text style={styles.ubsDistance}>
                    📍 {selectedUBS.distance.toFixed(2)} km de você
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSelectedUBS(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.ubsDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailText}>{selectedUBS.address}</Text>
                  {selectedUBS.district && (
                    <Text style={styles.districtText}>
                      {selectedUBS.district}
                      {selectedUBS.rpa && ` • RPA ${selectedUBS.rpa}`}
                    </Text>
                  )}
                </View>
              </View>

              {selectedUBS.phone && (
                <TouchableOpacity
                  style={styles.detailRow}
                  onPress={() => makeCall(selectedUBS.phone!)}
                >
                  <Ionicons name="call" size={20} color={Colors.primary} />
                  <Text style={[styles.detailText, styles.linkText]}>
                    {selectedUBS.phone}
                  </Text>
                </TouchableOpacity>
              )}

              {selectedUBS.openingHours && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color={Colors.primary} />
                  <Text style={styles.detailText}>{selectedUBS.openingHours}</Text>
                </View>
              )}

              {selectedUBS.services && selectedUBS.services.length > 0 && (
                <View style={styles.servicesContainer}>
                  <Text style={styles.servicesTitle}>Serviços:</Text>
                  {selectedUBS.services.map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={styles.serviceText}>• {service}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections(selectedUBS)}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.directionsButtonText}>Como Chegar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Mensagem quando não há UBS */}
      {ubsLocations.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="hospital-building"
            size={64}
            color={Colors.textLight}
          />
          <Text style={styles.emptyStateText}>
            Nenhuma UBS cadastrada ainda
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Os locais serão exibidos aqui quando forem adicionados
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    ...Shadows.sm,
  },
  controlButtons: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    gap: Spacing.sm,
  },
  controlButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  controlButtonDisabled: {
    opacity: 0.6,
  },
  ubsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    maxHeight: '50%',
    ...Shadows.lg,
  },
  ubsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ubsHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  ubsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  ubsDistance: {
    fontSize: 14,
    color: Colors.textLight,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  ubsDetails: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  districtText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  servicesContainer: {
    marginTop: Spacing.sm,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  serviceTag: {
    marginTop: Spacing.xs,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    ...Shadows.sm,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

export default MapsTab;
