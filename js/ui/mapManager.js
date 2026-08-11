import { CONFIG } from '../config.js';
import { showToast } from './toast.js';

let mapInstance = null;
let originMarker = null;
let destinationMarker = null;
let routePolyline = null;
let onPinDraggedCallback = null;

/**
 * Initializes Leaflet interactive map.
 */
export function initMap(containerId = 'map', onPinDragged) {
  if (mapInstance) return mapInstance;

  onPinDraggedCallback = onPinDragged;
  const defaultCenter = [CONFIG.DEFAULT_LOCATIONS.SANTIAGO.lat, CONFIG.DEFAULT_LOCATIONS.SANTIAGO.lon];

  mapInstance = L.map(containerId, {
    zoomControl: true,
    attributionControl: true
  }).setView(defaultCenter, 10);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(mapInstance);

  return mapInstance;
}

/**
 * Updates map view with draggable origin/destination markers and route polyline.
 */
export function updateMapRoute(origin, destination, polylineCoordinates, routeColor = '#3b82f6') {
  if (!mapInstance) return;

  const originIcon = L.divIcon({
    className: 'custom-pin pin-origin',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const destIcon = L.divIcon({
    className: 'custom-pin pin-destination',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  if (originMarker) mapInstance.removeLayer(originMarker);
  if (destinationMarker) mapInstance.removeLayer(destinationMarker);
  if (routePolyline) mapInstance.removeLayer(routePolyline);

  // Make markers DRAGGABLE
  originMarker = L.marker([origin.lat, origin.lon], { 
    icon: originIcon, 
    draggable: true,
    title: 'Arrastra para ajustar Origen'
  }).addTo(mapInstance);

  destinationMarker = L.marker([destination.lat, destination.lon], { 
    icon: destIcon, 
    draggable: true,
    title: 'Arrastra para ajustar Destino'
  }).addTo(mapInstance);

  // Listen to dragend events
  originMarker.on('dragend', (e) => {
    const newPos = e.target.getLatLng();
    showToast('Origen ajustado manualmente en el mapa. Haz clic en "Calcular recorrido".', 'info');
    if (onPinDraggedCallback) {
      onPinDraggedCallback('origin', { lat: newPos.lat, lon: newPos.lng, name: 'Ubicación seleccionada en mapa' });
    }
  });

  destinationMarker.on('dragend', (e) => {
    const newPos = e.target.getLatLng();
    showToast('Destino ajustado manualmente en el mapa. Haz clic en "Calcular recorrido".', 'info');
    if (onPinDraggedCallback) {
      onPinDraggedCallback('destination', { lat: newPos.lat, lon: newPos.lng, name: 'Ubicación seleccionada en mapa' });
    }
  });

  // Polyline
  routePolyline = L.polyline(polylineCoordinates, {
    color: routeColor,
    weight: 5,
    opacity: 0.85,
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(mapInstance);

  const bounds = L.latLngBounds([
    [origin.lat, origin.lon],
    [destination.lat, destination.lon]
  ]);
  
  mapInstance.fitBounds(bounds, { padding: [50, 50] });
}

export function setMapLoading(isLoading) {
  const overlay = document.getElementById('mapOverlay');
  if (overlay) {
    if (isLoading) overlay.classList.add('active');
    else overlay.classList.remove('active');
  }
}
