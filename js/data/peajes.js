/* ==========================================================================
   DATOS DE REFERENCIA DE PLAZAS DE PEAJE Y PÓRTICOS TAG EN CHILE
   ========================================================================== */
export const PEAJES_CHILE = [
  // --- RUTA 68 (Santiago - Valparaíso / Viña del Mar) ---
  { id: 'p-r68-zapata', name: 'Peaje Zapata', highway: 'Ruta 68', lat: -33.3934, lon: -71.2678, price: 2600 },
  { id: 'p-r68-lo-prado', name: 'Peaje Lo Prado', highway: 'Ruta 68', lat: -33.4542, lon: -70.8872, price: 2600 },

  // --- RUTA 5 SUR (Santiago - Talca - Concepción) ---
  { id: 'p-r5s-angostura', name: 'Peaje Nueva Angostura', highway: 'Ruta 5 Sur', lat: -33.8764, lon: -70.7412, price: 3300 },
  { id: 'p-r5s-quinta', name: 'Peaje Quinta', highway: 'Ruta 5 Sur', lat: -34.8210, lon: -70.9230, price: 3300 },
  { id: 'p-r5s-rio-claro', name: 'Peaje Río Claro', highway: 'Ruta 5 Sur', lat: -35.2650, lon: -71.4280, price: 3300 },

  // --- RUTA 5 NORTE (Santiago - La Serena) ---
  { id: 'p-r5n-lampa', name: 'Peaje Lampa / Lo Pinto', highway: 'Ruta 5 Norte', lat: -33.2680, lon: -70.7380, price: 1200 },
  { id: 'p-r5n-las-vegas', name: 'Peaje Las Vegas', highway: 'Ruta 5 Norte', lat: -32.7840, lon: -70.9320, price: 2800 },
  { id: 'p-r5n-pichidangui', name: 'Peaje Pichidangui', highway: 'Ruta 5 Norte', lat: -32.1280, lon: -71.5030, price: 3600 },
  { id: 'p-r5n-puerto-oscuro', name: 'Peaje Puerto Oscuro', highway: 'Ruta 5 Norte', lat: -31.4120, lon: -71.5780, price: 3600 },

  // --- RUTA 78 (Autopista del Sol: Santiago - San Antonio) ---
  { id: 'p-r78-melipilla', name: 'Peaje Melipilla', highway: 'Ruta 78', lat: -33.6840, lon: -71.2180, price: 3200 },

  // --- AUTOPISTAS URBANAS DE SANTIAGO (Pórticos TAG representativos) ---
  { id: 'p-tag-costanera-e', name: 'Pórtico Costanera Oriente', highway: 'Costanera Norte', lat: -33.4080, lon: -70.5750, price: 1100 },
  { id: 'p-tag-costanera-w', name: 'Pórtico Costanera Poniente', highway: 'Costanera Norte', lat: -33.4350, lon: -70.6720, price: 1100 },
  { id: 'p-tag-central-n', name: 'Pórtico Autopista Central Norte', highway: 'Autopista Central', lat: -33.4020, lon: -70.6890, price: 1250 },
  { id: 'p-tag-central-s', name: 'Pórtico Autopista Central Sur', highway: 'Autopista Central', lat: -33.5200, lon: -70.6880, price: 1250 },
  { id: 'p-tag-vespucio-n', name: 'Pórtico Vespucio Norte', highway: 'Vespucio Norte', lat: -33.3650, lon: -70.6810, price: 950 },
  { id: 'p-tag-vespucio-s', name: 'Pórtico Vespucio Sur', highway: 'Vespucio Sur', lat: -33.5380, lon: -70.6210, price: 950 },
  { id: 'p-tag-tunel-sc', name: 'Pórtico Túnel San Cristóbal', highway: 'Túnel San Cristóbal', lat: -33.4150, lon: -70.6280, price: 1450 },
  { id: 'p-tag-avo', name: 'Pórtico AVO (Vespucio Oriente)', highway: 'AVO', lat: -33.3980, lon: -70.5790, price: 1600 }
];
