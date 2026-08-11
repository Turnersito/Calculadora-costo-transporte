/* ==========================================================================
   CONFIG & CONSTANTS
   ========================================================================== */
export const CONFIG = {
  APP_NAME: 'RutaCost Chile',
  
  // API Endpoints (Public Free Services with zero API key required)
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org/search',
  OSRM_ROUTE_URL: 'https://router.project-osrm.org/route/v1/driving',
  
  // Chilean Default Updated Fuel Prices per Liter (CLP) - Aug 2026 Reference
  DEFAULT_FUEL_PRICES: {
    '93': 1280,
    '95': 1320,
    '97': 1370,
    'diesel': 1050
  },

  // Default Initial Vehicles Profile
  DEFAULT_VEHICLES: [
    {
      id: 'v-default-1',
      name: 'Auto Sedán Estándar',
      efficiency: 12.5,
      unit: 'kml',
      fuelType: '95',
      isDefault: true
    },
    {
      id: 'v-default-2',
      name: 'City Car Económico',
      efficiency: 16.0,
      unit: 'kml',
      fuelType: '93',
      isDefault: false
    },
    {
      id: 'v-default-3',
      name: 'Camioneta / SUV Diésel',
      efficiency: 11.0,
      unit: 'kml',
      fuelType: 'diesel',
      isDefault: false
    }
  ],

  // Pre-configured Default Locations for Chile
  DEFAULT_LOCATIONS: {
    SANTIAGO: { name: 'Santiago, Región Metropolitana', lat: -33.4489, lon: -70.6693 },
    VINA_DEL_MAR: { name: 'Viña del Mar, Valparaíso', lat: -33.0245, lon: -71.5518 }
  }
};
