import { CONFIG } from '../config.js';

/**
 * Fetches real-time fuel prices from local proxy endpoint (/api/combustible).
 * Solves CORS issues by calling CNE Chile via local backend proxy server.
 */
export async function getFuelPrices() {
  const timestamp = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  try {
    const response = await fetch('/api/combustible', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.precios) {
        return {
          prices: {
            '93': Number(data.precios['93']) || CONFIG.DEFAULT_FUEL_PRICES['93'],
            '95': Number(data.precios['95']) || CONFIG.DEFAULT_FUEL_PRICES['95'],
            '97': Number(data.precios['97']) || CONFIG.DEFAULT_FUEL_PRICES['97'],
            'diesel': Number(data.precios['diesel']) || CONFIG.DEFAULT_FUEL_PRICES['diesel']
          },
          isLiveAPI: true,
          sourceText: data.source || 'CNE Chile API (Proxy)',
          timestamp: `En vivo ${timestamp}`
        };
      }
    }
  } catch (err) {
    console.warn('Proxy CNE API skipped, fallback activated:', err.message);
  }

  return {
    prices: { ...CONFIG.DEFAULT_FUEL_PRICES },
    isLiveAPI: false,
    sourceText: 'Referencia Chile (CNE Base)',
    timestamp: `Actualizado ${timestamp}`
  };
}
