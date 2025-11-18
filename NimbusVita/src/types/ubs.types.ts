/**
 * Tipos para Unidades Básicas de Saúde (UBS)
 */

export interface UBSLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  services?: string[];
  district?: string; // Bairro/Distrito
  cnes?: string; // Código Nacional de Estabelecimento de Saúde
  rpa?: string; // Região Político-Administrativa
  distance?: number; // Distância em km do usuário
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
