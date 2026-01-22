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
import { HealthLocation, CreateHealthLocationDTO, UpdateHealthLocationDTO } from '../../types/health-location.types';
import {
  getHealthLocations,
  createHealthLocation,
  updateHealthLocation,
  deleteHealthLocation,
  deactivateHealthLocation,
  cleanExpiredEvents,
} from '../../services/supabase/health-location.service';
import { HealthLocationForm } from '../../components/HealthLocationForm';
import { HealthLocationList } from '../../components/HealthLocationList';

const MapsTab = () => {
  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true);
  
  // Estados
  const [userLocation, setUserLocation] = useState<MapRegion | null>(null);
  const [ubsLocations, setUbsLocations] = useState<UBSLocation[]>([]);
  const [selectedUBS, setSelectedUBS] = useState<UBSLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  
  // Estados para gerenciamento de locais de saúde
  const [healthLocations, setHealthLocations] = useState<HealthLocation[]>([]);
  const [showHealthLocationForm, setShowHealthLocationForm] = useState(false);
  const [showHealthLocationList, setShowHealthLocationList] = useState(false);
  const [editingHealthLocation, setEditingHealthLocation] = useState<HealthLocation | null>(null);
  
  // Estados para seleção de localização no mapa
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);

  // Região inicial (Brasil - Recife como padrão)
  const defaultRegion: MapRegion = {
    latitude: -8.0476,
    longitude: -34.8770,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  useEffect(() => {
    const initialize = async () => {
      await loadUBSLocations();
      await loadHealthLocations();
      await requestLocationPermission();
    };
    initialize();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Carrega todos os locais de saúde customizados
   */
  const loadHealthLocations = async () => {
    try {
      console.log('🏥 Carregando locais de saúde customizados...');
      
      // Limpa eventos expirados primeiro
      await cleanExpiredEvents();
      
      const result = await getHealthLocations({ is_active: true });
      
      if (!isMountedRef.current) return;
      
      if (result.ok && Array.isArray(result.data)) {
        console.log('✅ Locais de saúde carregados:', result.data.length);
        setHealthLocations(result.data);
      } else {
        console.error('❌ Erro ao carregar locais:', result.message);
      }
    } catch (error) {
      console.error('❌ Erro exception ao carregar locais:', error);
    }
  };

  /**
   * Carrega todas as UBS do banco de dados
   */
  const loadUBSLocations = async () => {
    try {
      console.log('🗺️ Carregando UBS...');
      const result = await getAllUBS();
      
      if (!isMountedRef.current) return;
      
      if (result.ok && result.data && result.data.length > 0) {
        console.log('✅ UBS carregadas com sucesso:', result.data.length);
        setUbsLocations(result.data);
      } else {
        console.error('❌ Erro ao carregar UBS:', result.message);
        Alert.alert(
          'Erro ao carregar UBS',
          result.message || 'Não foi possível carregar as UBS. Verifique sua conexão.'
        );
      }
    } catch (error) {
      console.error('❌ Erro exception:', error);
      Alert.alert('Erro', 'Erro inesperado ao carregar UBS');
    }
  };

  /**
   * Solicita permissão de localização
   */
  const requestLocationPermission = async () => {
    try {
      if (isMountedRef.current) setLoading(false); // Remove loading logo após carregar UBS
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        await getUserLocation();
      } else {
        Alert.alert(
          'Permissão Negada',
          'Permita o acesso à localização para ver UBS próximas a você.',
          [{ text: 'OK' }]
        );
        if (isMountedRef.current) setUserLocation(defaultRegion);
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      if (isMountedRef.current) setUserLocation(defaultRegion);
    }
  };

  /**
   * Obtém a localização atual do usuário
   */
  const getUserLocation = async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) setLoadingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!isMountedRef.current) return;

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

      // Calculate and sort UBS by distance from user location
      // Use calculateDistance() from ubs.service.ts
      calculateDistances(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      if (isMountedRef.current) setLoadingLocation(false);
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
    console.log('📏 Calculando distâncias. UBS disponíveis:', ubsLocations.length);
    
    // Só calcula se houver UBS
    if (ubsLocations.length === 0) {
      console.log('⚠️ Nenhuma UBS para calcular distância');
      return;
    }

    const ubsWithDistances = ubsLocations.map((ubs) => ({
      ...ubs,
      distance: calculateDistance(userLat, userLon, ubs.latitude, ubs.longitude),
    }));

    // Ordena por distância
    ubsWithDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    console.log('✅ Distâncias calculadas. Total UBS:', ubsWithDistances.length);
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
   * Handlers para gerenciamento de locais de saúde
   */
  const handleCreateHealthLocation = async (data: CreateHealthLocationDTO) => {
    try {
      const result = await createHealthLocation(data);
      if (result.ok) {
        Alert.alert('Sucesso', 'Local de saúde adicionado com sucesso!');
        await loadHealthLocations();
        setShowHealthLocationForm(false);
      } else {
        Alert.alert('Erro', result.message || 'Erro ao adicionar local');
      }
    } catch (error) {
      console.error('Erro ao criar local:', error);
      Alert.alert('Erro', 'Erro inesperado ao criar local');
    }
  };

  const handleUpdateHealthLocation = async (data: UpdateHealthLocationDTO) => {
    if (!editingHealthLocation) return;
    
    try {
      const result = await updateHealthLocation(editingHealthLocation.id, data);
      if (result.ok) {
        Alert.alert('Sucesso', 'Local de saúde atualizado com sucesso!');
        await loadHealthLocations();
        setShowHealthLocationForm(false);
        setEditingHealthLocation(null);
      } else {
        Alert.alert('Erro', result.message || 'Erro ao atualizar local');
      }
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      Alert.alert('Erro', 'Erro inesperado ao atualizar local');
    }
  };

  const handleDeleteHealthLocation = async (id: string) => {
    try {
      const result = await deleteHealthLocation(id);
      if (result.ok) {
        Alert.alert('Sucesso', 'Local de saúde excluído com sucesso!');
        await loadHealthLocations();
      } else {
        Alert.alert('Erro', result.message || 'Erro ao excluir local');
      }
    } catch (error) {
      console.error('Erro ao excluir local:', error);
      Alert.alert('Erro', 'Erro inesperado ao excluir local');
    }
  };

  const handleToggleActiveHealthLocation = async (id: string, isActive: boolean) => {
    try {
      const result = isActive
        ? await updateHealthLocation(id, { is_active: true })
        : await deactivateHealthLocation(id);
      
      if (result.ok) {
        Alert.alert('Sucesso', `Local ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
        await loadHealthLocations();
      } else {
        Alert.alert('Erro', result.message || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      Alert.alert('Erro', 'Erro inesperado ao alterar status');
    }
  };

  const handleEditHealthLocation = (location: HealthLocation) => {
    setEditingHealthLocation(location);
    setShowHealthLocationList(false);
    setShowHealthLocationForm(true);
  };

  const handleCloseForm = () => {
    setShowHealthLocationForm(false);
    setEditingHealthLocation(null);
    setIsPickingLocation(false);
    setSelectedCoordinates(null);
    setTempMarker(null);
  };

  const handlePickLocation = () => {
    setIsPickingLocation(true);
    setShowHealthLocationForm(false);
    Alert.alert(
      'Selecionar Localização',
      'Toque no mapa para selecionar a localização desejada',
      [{ text: 'OK' }]
    );
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NimbusVita/1.0',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const parts = [];
        
        // Monta o endereço no formato brasileiro
        if (addr.road || addr.street) {
          parts.push(addr.road || addr.street);
        }
        if (addr.house_number) {
          parts[parts.length - 1] = `${parts[parts.length - 1]}, ${addr.house_number}`;
        }
        if (addr.suburb || addr.neighbourhood) {
          parts.push(addr.suburb || addr.neighbourhood);
        }
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state) {
          parts.push(addr.state);
        }
        
        return parts.join(' - ') || data.display_name || 'Endereço não encontrado';
      }
      
      return data.display_name || 'Endereço não encontrado';
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return 'Endereço não disponível';
    }
  };

  const handleMapPress = async (event: any) => {
    if (isPickingLocation) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setTempMarker({ latitude, longitude });
      setSelectedCoordinates({ latitude, longitude });
      
      // Buscar endereço
      Alert.alert('Buscando endereço...', 'Aguarde um momento');
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      // Atualizar estado com endereço
      setSelectedCoordinates({ 
        latitude, 
        longitude,
        address 
      } as any);
      
      // Voltar ao formulário automaticamente
      setTimeout(() => {
        setIsPickingLocation(false);
        setShowHealthLocationForm(true);
        Alert.alert(
          'Localização Selecionada',
          `📍 ${address}\n\nLat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}\n\nVerifique o endereço e ajuste se necessário.`,
          [{ text: 'OK' }]
        );
      }, 500);
    }
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
        onPress={handleMapPress}
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
                size={20}
                color={Colors.primary}
              />
            </View>
          </Marker>
        ))}

        {/* Marcadores dos locais de saúde customizados */}
        {healthLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            description={location.address}
          >
            <View style={[
              styles.markerContainer,
              location.type === 'event' ? styles.eventMarker : styles.ubsMarker
            ]}>
              <Text style={styles.markerEmoji}>
                {location.type === 'ubs' ? '🏥' : '📅'}
              </Text>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{location.name}</Text>
                <Text style={styles.calloutType}>
                  {location.type === 'ubs' ? 'UBS' : 'Evento'}
                </Text>
                {location.description && (
                  <Text style={styles.calloutDescription}>{location.description}</Text>
                )}
                <Text style={styles.calloutAddress}>{location.address}</Text>
                {location.event_date && (
                  <Text style={styles.calloutDate}>
                    📅 {new Date(location.event_date).toLocaleDateString('pt-BR')}
                    {location.event_time && ` às ${location.event_time}`}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcador temporário ao selecionar localização */}
        {tempMarker && (
          <Marker
            coordinate={tempMarker}
            pinColor={Colors.success}
          >
            <View style={styles.tempMarkerContainer}>
              <Text style={styles.tempMarkerIcon}>📍</Text>
              <Text style={styles.tempMarkerText}>Nova localização</Text>
            </View>
          </Marker>
        )}

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

      {/* Banner quando estiver selecionando localização */}
      {isPickingLocation && (
        <View style={styles.pickingLocationBanner}>
          <Text style={styles.pickingLocationIcon}>👆</Text>
          <View style={styles.pickingLocationTextContainer}>
            <Text style={styles.pickingLocationTitle}>Selecione no Mapa</Text>
            <Text style={styles.pickingLocationSubtitle}>
              Toque no local desejado
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelPickingButton}
            onPress={() => {
              setIsPickingLocation(false);
              setTempMarker(null);
              setShowHealthLocationForm(true);
            }}
          >
            <Text style={styles.cancelPickingText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

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

        {/* Botão adicionar local */}
        <TouchableOpacity
          style={[styles.controlButton, styles.addButton]}
          onPress={() => setShowHealthLocationForm(true)}
        >
          <Ionicons name="add" size={24} color={Colors.textWhite} />
        </TouchableOpacity>

        {/* Botão de lista de locais customizados */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowHealthLocationList(true)}
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

      {/* Modal de formulário */}
      <HealthLocationForm
        visible={showHealthLocationForm}
        onClose={handleCloseForm}
        onSubmit={(data) => {
          if (editingHealthLocation) {
            return handleUpdateHealthLocation(data);
          } else {
            return handleCreateHealthLocation(data as CreateHealthLocationDTO);
          }
        }}
        onPickLocation={handlePickLocation}
        selectedCoordinates={selectedCoordinates || undefined}
        initialData={editingHealthLocation ? {
          type: editingHealthLocation.type,
          name: editingHealthLocation.name,
          description: editingHealthLocation.description,
          address: editingHealthLocation.address,
          latitude: editingHealthLocation.latitude,
          longitude: editingHealthLocation.longitude,
          contact_phone: editingHealthLocation.contact_phone,
          contact_email: editingHealthLocation.contact_email,
          event_date: editingHealthLocation.event_date,
          event_time: editingHealthLocation.event_time,
          event_end_date: editingHealthLocation.event_end_date,
        } : undefined}
        mode={editingHealthLocation ? 'edit' : 'create'}
      />

      {/* Modal de lista */}
      {showHealthLocationList && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Locais de Saúde</Text>
              <TouchableOpacity onPress={() => setShowHealthLocationList(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <HealthLocationList
              locations={healthLocations}
              onEdit={handleEditHealthLocation}
              onDelete={handleDeleteHealthLocation}
              onToggleActive={handleToggleActiveHealthLocation}
            />
          </View>
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
    borderRadius: 32,
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
    marginBottom: Spacing.lg,
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
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para marcadores customizados
  ubsMarker: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  eventMarker: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  markerEmoji: {
    fontSize: 16,
  },
  calloutContainer: {
    padding: Spacing.sm,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  calloutAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  calloutDate: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  // Estilos para o modal de lista
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  // Estilos para marcador temporário
  tempMarkerContainer: {
    backgroundColor: Colors.success,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tempMarkerIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tempMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  // Estilos para o banner de seleção
  pickingLocationBanner: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickingLocationIcon: {
    fontSize: 32,
  },
  pickingLocationTextContainer: {
    flex: 1,
  },
  pickingLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textWhite,
    marginBottom: 2,
  },
  pickingLocationSubtitle: {
    fontSize: 13,
    color: Colors.textWhite,
    opacity: 0.9,
  },
  cancelPickingButton: {
    backgroundColor: Colors.textWhite,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  cancelPickingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default MapsTab;
