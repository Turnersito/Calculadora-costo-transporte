import { CONFIG } from '../config.js';

// Chilean Pre-cached Known Cities & Locations Dictionary (Fast 0ms Lookup)
const CHILE_KNOWN_CITIES = [
  { name: 'Santiago, Chile', shortName: 'Santiago, Región Metropolitana', lat: -33.4489, lon: -70.6693, keywords: ['santiago', 'stgo', 'metropolitana'] },
  { name: 'Viña del Mar, Chile', shortName: 'Viña del Mar, Valparaíso', lat: -33.0245, lon: -71.5518, keywords: ['viña', 'vina', 'viña del mar', 'vina del mar'] },
  { name: 'Valparaíso, Chile', shortName: 'Valparaíso, Valparaíso', lat: -33.0472, lon: -71.6127, keywords: ['valparaiso', 'valparaíso', 'valpo'] },
  { name: 'Concepción, Chile', shortName: 'Concepción, Biobío', lat: -36.8201, lon: -73.0444, keywords: ['concepcion', 'concepción', 'conce'] },
  { name: 'La Serena, Chile', shortName: 'La Serena, Coquimbo', lat: -29.9027, lon: -71.2519, keywords: ['la serena', 'serena'] },
  { name: 'Coquimbo, Chile', shortName: 'Coquimbo, Coquimbo', lat: -29.9533, lon: -71.3436, keywords: ['coquimbo'] },
  { name: 'Antofagasta, Chile', shortName: 'Antofagasta, Antofagasta', lat: -23.6509, lon: -70.3975, keywords: ['antofagasta', 'antofa'] },
  { name: 'Temuco, Chile', shortName: 'Temuco, Araucanía', lat: -38.7359, lon: -72.5904, keywords: ['temuco'] },
  { name: 'Puerto Montt, Chile', shortName: 'Puerto Montt, Los Lagos', lat: -41.4689, lon: -72.9411, keywords: ['puerto montt', 'ptomontt'] },
  { name: 'Rancagua, Chile', shortName: 'Rancagua, O\'Higgins', lat: -34.1701, lon: -70.7444, keywords: ['rancagua'] },
  { name: 'Talca, Chile', shortName: 'Talca, Maule', lat: -35.4264, lon: -71.6554, keywords: ['talca'] },
  { name: 'Chillán, Chile', shortName: 'Chillán, Ñuble', lat: -36.6063, lon: -72.1023, keywords: ['chillan', 'chillán'] },
  { name: 'Iquique, Chile', shortName: 'Iquique, Tarapacá', lat: -20.2307, lon: -70.1357, keywords: ['iquique'] },
  { name: 'Arica, Chile', shortName: 'Arica, Arica y Parinacota', lat: -18.4783, lon: -70.3126, keywords: ['arica'] },
  { name: 'Punta Arenas, Chile', shortName: 'Punta Arenas, Magallanes', lat: -53.1638, lon: -70.9171, keywords: ['punta arenas'] }
];

/**
 * Searches for location suggestions with Nominatim (HTTPS, countrycodes=cl & addressdetails=1).
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.toLowerCase().trim();

  // 1. Search local Chilean dictionary first for instant 0ms match
  const localMatches = CHILE_KNOWN_CITIES.filter(city => 
    city.keywords.some(k => k.includes(cleanQuery) || cleanQuery.includes(k)) ||
    city.name.toLowerCase().includes(cleanQuery) ||
    city.shortName.toLowerCase().includes(cleanQuery)
  );

  // 2. Fetch from Nominatim HTTPS API
  const url = `${CONFIG.NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&countrycodes=cl&addressdetails=1&limit=6`;

  try {
    const response = await fetch(url, { 
      headers: { 'Accept-Language': 'es' },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return localMatches;

    const data = await response.json();
    const apiResults = data.map(item => {
      const addr = item.address || {};
      const road = addr.road || addr.pedestrian || addr.street || '';
      const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
      const suburb = addr.suburb || addr.neighbourhood || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || '';
      
      const mainTitle = road ? `${road}${houseNumber}` : item.name;
      const subtitle = [suburb, city, addr.state].filter(Boolean).join(', ');
      
      return {
        name: item.display_name,
        shortName: subtitle ? `${mainTitle}, ${subtitle}` : mainTitle,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      };
    });

    return [...localMatches, ...apiResults];
  } catch (err) {
    console.warn('Nominatim API search fallback activated:', err);
    return localMatches;
  }
}

/**
 * Geocodes location text to coordinates.
 */
export async function geocodeLocation(locationText) {
  if (!locationText || locationText.trim().length === 0) {
    throw new Error('Por favor ingresa un nombre de ciudad o dirección.');
  }

  const suggestions = await searchLocations(locationText);
  if (suggestions.length > 0) {
    return suggestions[0];
  }

  throw new Error(`No pudimos encontrar la dirección "${locationText}". Por favor intenta seleccionar una opción de la lista de sugerencias o ajusta el pin en el mapa.`);
}

/**
 * Calculates driving routes using OSRM API with HTTPS, timeout (9s) and fallback mirror server.
 */
export async function calculateRouteOSRM(originCoords, destCoords) {
  const coordsString = `${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}`;
  const primaryUrl = `${CONFIG.OSRM_ROUTE_URL}/${coordsString}?overview=full&geometries=geojson&alternatives=true`;
  const fallbackUrl = `${CONFIG.OSRM_FALLBACK_URL}/${coordsString}?overview=full&geometries=geojson&alternatives=true`;

  console.log(`🚗 [RutaCost] Solicitando ruta (HTTPS) a OSRM API: ${coordsString}`);

  let data = null;

  // Try primary OSRM server with 9s timeout
  try {
    const response = await fetch(primaryUrl, {
      signal: AbortSignal.timeout(9000)
    });
    if (response.ok) {
      data = await response.json();
    }
  } catch (primaryErr) {
    console.warn('⚡ [RutaCost] Servidor primario OSRM falló o agotó tiempo de espera, probando servidor de respaldo:', primaryErr.message);
  }

  // Try fallback OSRM mirror if primary failed
  if (!data) {
    try {
      const fallbackResponse = await fetch(fallbackUrl, {
        signal: AbortSignal.timeout(9000)
      });
      if (fallbackResponse.ok) {
        data = await fallbackResponse.json();
      }
    } catch (fallbackErr) {
      console.error('❌ [RutaCost] Servidor de respaldo OSRM también falló:', fallbackErr.message);
    }
  }

  // If both failed or timed out
  if (!data || !data.routes || data.routes.length === 0) {
    throw new Error('El servicio de rutas en línea tardó demasiado en responder o no está disponible en este momento. Por favor presiona "Calcular recorrido" para reintentar.');
  }

  return data.routes.map((route, index) => ({
    id: `route-${index}`,
    distanceKm: route.distance / 1000,
    durationMins: route.duration / 60,
    polyline: route.geometry.coordinates.map(coord => [coord[1], coord[0]])
  }));
}
