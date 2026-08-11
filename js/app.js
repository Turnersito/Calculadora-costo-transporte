import { CONFIG } from './config.js';
import { formatCLP, formatDistance, formatDuration } from './utils/formatters.js';
import { calculateTripCost } from './utils/calculator.js';
import { getSavedVehicles, getActiveVehicleId, updateVehicle } from './services/storage.js';
import { getFuelPrices } from './services/fuelApi.js';
import { geocodeLocation, calculateRouteOSRM, searchLocations } from './services/routing.js';
import { detectTollsOnRoute, calculateTotalTollsCost } from './services/tollService.js';
import { initMap, updateMapRoute, setMapLoading } from './ui/mapManager.js';
import { initVehicleModal } from './ui/vehicleModal.js';
import { showToast } from './ui/toast.js';

// Application State
const state = {
  fuelPrices: { ...CONFIG.DEFAULT_FUEL_PRICES },
  isManualFuelPrice: false,
  originCoords: CONFIG.DEFAULT_LOCATIONS.SANTIAGO,
  destinationCoords: CONFIG.DEFAULT_LOCATIONS.VINA_DEL_MAR,
  routesList: [], // Array of alternative routes
  activeRouteIndex: 0,
  detectedTolls: [],
  selectedVehicle: null
};

// DOM Elements Cache
const elements = {};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [RutaCost] Inicializando aplicación...');
  cacheElements();
  
  // Init Map with draggable pin callback
  initMap('map', (type, newCoords) => {
    if (type === 'origin') {
      state.originCoords = newCoords;
      if (elements.inputOrigin) elements.inputOrigin.value = newCoords.name || 'Ubicación seleccionada';
    } else if (type === 'destination') {
      state.destinationCoords = newCoords;
      if (elements.inputDestination) elements.inputDestination.value = newCoords.name || 'Ubicación seleccionada';
    }
  });

  await setupFuelPrices();
  setupVehicleProfiles();
  setupAutocomplete();
  setupEventListeners();

  // Initial calculation on launch
  handleCalculateTrip();
});

function cacheElements() {
  elements.tripForm = document.getElementById('tripForm');
  elements.inputOrigin = document.getElementById('inputOrigin');
  elements.inputDestination = document.getElementById('inputDestination');
  elements.suggestionsOrigin = document.getElementById('suggestionsOrigin');
  elements.suggestionsDestination = document.getElementById('suggestionsDestination');
  elements.btnClearOrigin = document.getElementById('btnClearOrigin');
  elements.btnClearDestination = document.getElementById('btnClearDestination');
  elements.btnSwapLocations = document.getElementById('btnSwapLocations');

  elements.activeVehicleAvatar = document.getElementById('activeVehicleAvatar');
  elements.activeVehicleName = document.getElementById('activeVehicleName');
  elements.selectVehicle = document.getElementById('selectVehicle');
  elements.inputEfficiency = document.getElementById('inputEfficiency');
  elements.selectUnit = document.getElementById('selectUnit');
  elements.selectFuelType = document.getElementById('selectFuelType');
  elements.inputFuelPrice = document.getElementById('inputFuelPrice');
  elements.btnToggleManualPrice = document.getElementById('btnToggleManualPrice');
  elements.fuelPriceSourceBadge = document.getElementById('fuelPriceSourceBadge');
  elements.fuelPriceTimestamp = document.getElementById('fuelPriceTimestamp');

  elements.btnToggleAdvanced = document.getElementById('btnToggleAdvanced');
  elements.advancedOptionsBody = document.getElementById('advancedOptionsBody');
  elements.accordionChevron = document.getElementById('accordionChevron');
  elements.checkboxRoundTrip = document.getElementById('checkboxRoundTrip');
  elements.inputPassengers = document.getElementById('inputPassengers');

  elements.btnCalculate = document.getElementById('btnCalculate');
  elements.resultCard = document.getElementById('resultCard');

  // Route Preference Cards
  elements.routePreferenceCard = document.getElementById('routePreferenceCard');
  elements.cardRouteFastest = document.getElementById('cardRouteFastest');
  elements.cardRouteCheapest = document.getElementById('cardRouteCheapest');
  elements.optFastestTime = document.getElementById('optFastestTime');
  elements.optFastestCost = document.getElementById('optFastestCost');
  elements.optCheapestTime = document.getElementById('optCheapestTime');
  elements.optCheapestCost = document.getElementById('optCheapestCost');

  // Results DOM
  elements.resTotalCost = document.getElementById('resTotalCost');
  elements.passengerCostRow = document.getElementById('passengerCostRow');
  elements.resPassengerCount = document.getElementById('resPassengerCount');
  elements.resPassengerCost = document.getElementById('resPassengerCost');
  elements.resDistance = document.getElementById('resDistance');
  elements.resDuration = document.getElementById('resDuration');
  elements.resLiters = document.getElementById('resLiters');
  elements.resFuelCostOnly = document.getElementById('resFuelCostOnly');
  elements.tripTypeTag = document.getElementById('tripTypeTag');

  // Tolls DOM
  elements.tollsListContainer = document.getElementById('tollsListContainer');
  elements.detectedTollsCount = document.getElementById('detectedTollsCount');

  elements.fDist = document.getElementById('fDist');
  elements.fEff = document.getElementById('fEff');
  elements.fPrice = document.getElementById('fPrice');
  elements.fResult = document.getElementById('fResult');
}

/**
 * Initializes fuel prices from proxy endpoint.
 */
async function setupFuelPrices() {
  const result = await getFuelPrices();
  state.fuelPrices = result.prices;

  if (elements.fuelPriceSourceBadge) {
    elements.fuelPriceSourceBadge.innerText = result.sourceText;
    elements.fuelPriceSourceBadge.className = `price-badge ${result.isLiveAPI ? 'badge-cne' : 'badge-manual'}`;
  }

  if (elements.fuelPriceTimestamp) {
    elements.fuelPriceTimestamp.innerText = result.timestamp;
  }

  updatePriceInputForSelectedFuel();
}

function updatePriceInputForSelectedFuel() {
  if (state.isManualFuelPrice) return;
  const selectedFuel = elements.selectFuelType?.value || '95';
  const price = state.fuelPrices[selectedFuel] || CONFIG.DEFAULT_FUEL_PRICES['95'];
  if (elements.inputFuelPrice) {
    elements.inputFuelPrice.value = price;
  }
}

/**
 * Sets up vehicle profiles and updates header avatar card.
 */
function setupVehicleProfiles() {
  initVehicleModal((selectedVehicle) => {
    state.selectedVehicle = selectedVehicle;
    if (elements.inputEfficiency) elements.inputEfficiency.value = selectedVehicle.efficiency;
    if (elements.selectUnit) elements.selectUnit.value = selectedVehicle.unit;
    if (elements.selectFuelType) {
      elements.selectFuelType.value = selectedVehicle.fuelType;
      updatePriceInputForSelectedFuel();
    }
    updateActiveVehicleAvatarUI(selectedVehicle);
    showToast(`Vehículo activo: ${selectedVehicle.name}`, 'info');
  });

  const vehicles = getSavedVehicles();
  const activeId = getActiveVehicleId();
  const activeVehicle = vehicles.find(v => v.id === activeId) || vehicles[0];

  if (activeVehicle) {
    state.selectedVehicle = activeVehicle;
    if (elements.inputEfficiency) elements.inputEfficiency.value = activeVehicle.efficiency;
    if (elements.selectUnit) elements.selectUnit.value = activeVehicle.unit;
    if (elements.selectFuelType) elements.selectFuelType.value = activeVehicle.fuelType || '95';
    updatePriceInputForSelectedFuel();
    updateActiveVehicleAvatarUI(activeVehicle);
  }
}

function updateActiveVehicleAvatarUI(vehicle) {
  if (elements.activeVehicleName) elements.activeVehicleName.innerText = vehicle.name;
  if (elements.activeVehicleAvatar) {
    if (vehicle.photoBase64) {
      elements.activeVehicleAvatar.innerHTML = `<img src="${vehicle.photoBase64}" alt="${vehicle.name}">`;
    } else {
      elements.activeVehicleAvatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
    }
  }
}

/**
 * Event Listeners for UI interaction.
 * IMPORTANT: NO automatic recalculation on input change! Calculation ONLY triggers on button click!
 */
function setupEventListeners() {
  // EXPLICIT BUTTON CLICK TRIGGER ONLY
  elements.btnCalculate?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('⚡ [RutaCost] Clic detectado en el botón "Calcular recorrido"');
    
    // Save updated efficiency back to profile if modified
    if (state.selectedVehicle && elements.inputEfficiency) {
      const newEff = parseFloat(elements.inputEfficiency.value) || state.selectedVehicle.efficiency;
      const newUnit = elements.selectUnit?.value || state.selectedVehicle.unit;
      updateVehicle(state.selectedVehicle.id, { efficiency: newEff, unit: newUnit });
    }

    handleCalculateTrip();
  });

  // Fuel type change
  elements.selectFuelType?.addEventListener('change', () => {
    updatePriceInputForSelectedFuel();
  });

  // Manual price override toggle
  elements.btnToggleManualPrice?.addEventListener('click', () => {
    state.isManualFuelPrice = !state.isManualFuelPrice;
    if (state.isManualFuelPrice) {
      elements.btnToggleManualPrice.innerText = 'Auto API';
      if (elements.fuelPriceSourceBadge) {
        elements.fuelPriceSourceBadge.innerText = 'Ingreso Manual';
        elements.fuelPriceSourceBadge.className = 'price-badge badge-manual';
      }
      showToast('Modo precio manual activado.', 'info');
    } else {
      elements.btnToggleManualPrice.innerText = 'Manual';
      setupFuelPrices();
    }
  });

  // Swap origin and destination
  elements.btnSwapLocations?.addEventListener('click', () => {
    const valA = elements.inputOrigin.value;
    const valB = elements.inputDestination.value;
    elements.inputOrigin.value = valB;
    elements.inputDestination.value = valA;

    const tempCoords = state.originCoords;
    state.originCoords = state.destinationCoords;
    state.destinationCoords = tempCoords;
  });

  // Accordion toggle
  elements.btnToggleAdvanced?.addEventListener('click', () => {
    const isHidden = elements.advancedOptionsBody.classList.contains('hidden');
    if (isHidden) {
      elements.advancedOptionsBody.classList.remove('hidden');
      elements.accordionChevron.classList.add('open');
    } else {
      elements.advancedOptionsBody.classList.add('hidden');
      elements.accordionChevron.classList.remove('open');
    }
  });

  // Clear input buttons
  elements.btnClearOrigin?.addEventListener('click', () => {
    elements.inputOrigin.value = '';
    elements.inputOrigin.focus();
  });

  elements.btnClearDestination?.addEventListener('click', () => {
    elements.inputDestination.value = '';
    elements.inputDestination.focus();
  });

  // Route Preference Cards Click Handlers
  elements.cardRouteFastest?.addEventListener('click', () => {
    selectRouteOption(0);
  });

  elements.cardRouteCheapest?.addEventListener('click', () => {
    // Find route index with lowest total cost
    let cheapestIndex = 0;
    let minCost = Infinity;
    state.routesList.forEach((r, idx) => {
      if (r.totalEvaluatedCost < minCost) {
        minCost = r.totalEvaluatedCost;
        cheapestIndex = idx;
      }
    });
    selectRouteOption(cheapestIndex);
  });
}

function setupAutocomplete() {
  setupInputAutocomplete(elements.inputOrigin, elements.suggestionsOrigin, (selectedLocation) => {
    state.originCoords = selectedLocation;
  });

  setupInputAutocomplete(elements.inputDestination, elements.suggestionsDestination, (selectedLocation) => {
    state.destinationCoords = selectedLocation;
  });
}

function setupInputAutocomplete(inputEl, suggestionsEl, onSelectCoords) {
  let timeoutId = null;

  inputEl?.addEventListener('input', (e) => {
    const query = e.target.value;
    clearTimeout(timeoutId);

    if (query.trim().length < 2) {
      suggestionsEl.classList.remove('active');
      return;
    }

    // Debounce of ~400ms to avoid saturating Nominatim API
    timeoutId = setTimeout(async () => {
      const results = await searchLocations(query);
      if (results.length === 0) {
        suggestionsEl.classList.remove('active');
        return;
      }

      suggestionsEl.innerHTML = '';
      results.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerText = loc.shortName || loc.name;
        item.addEventListener('click', () => {
          inputEl.value = loc.shortName || loc.name;
          onSelectCoords({ lat: loc.lat, lon: loc.lon, name: loc.name, shortName: loc.shortName });
          suggestionsEl.classList.remove('active');
        });
        suggestionsEl.appendChild(item);
      });
      suggestionsEl.classList.add('active');
    }, 400);
  });

  document.addEventListener('click', (e) => {
    if (!inputEl?.contains(e.target) && !suggestionsEl?.contains(e.target)) {
      suggestionsEl?.classList.remove('active');
    }
  });
}

/**
 * Main calculation logic triggered ONLY by explicit button click.
 */
async function handleCalculateTrip() {
  console.log('🏁 [RutaCost] Ejecutando cálculo completo...');
  const originText = elements.inputOrigin?.value?.trim();
  const destText = elements.inputDestination?.value?.trim();

  if (!originText || !destText) {
    showToast('Ingresa origen y destino para calcular.', 'error');
    return;
  }

  setMapLoading(true);

  try {
    // 1. Geocode origin & destination
    const originCoords = (state.originCoords && (state.originCoords.name === originText || state.originCoords.shortName === originText))
      ? state.originCoords
      : await geocodeLocation(originText);

    const destCoords = (state.destinationCoords && (state.destinationCoords.name === destText || state.destinationCoords.shortName === destText))
      ? state.destinationCoords
      : await geocodeLocation(destText);

    state.originCoords = originCoords;
    state.destinationCoords = destCoords;

    // 2. Fetch OSRM driving routes (with alternatives)
    const routes = await calculateRouteOSRM(originCoords, destCoords);
    state.routesList = routes;

    // 3. Evaluate fuel & toll costs for each alternative route
    const pricePerLiter = parseFloat(elements.inputFuelPrice?.value) || 1320;
    const efficiency = parseFloat(elements.inputEfficiency?.value) || 12.5;
    const unit = elements.selectUnit?.value || 'kml';
    const isRoundTrip = elements.checkboxRoundTrip?.checked || false;

    state.routesList.forEach(route => {
      const tolls = detectTollsOnRoute(route.polyline);
      const tollsCost = calculateTotalTollsCost(tolls) * (isRoundTrip ? 2 : 1);
      
      const calc = calculateTripCost({
        distanceKm: route.distanceKm,
        efficiency,
        unit,
        pricePerLiter,
        isRoundTrip,
        tollsCost,
        passengers: 1
      });

      route.tolls = tolls;
      route.tollsCost = tollsCost;
      route.fuelCost = calc.fuelCost;
      route.totalEvaluatedCost = calc.totalCost;
    });

    // 4. Render Route Preference Comparison (Fastest vs Cheapest)
    renderRouteComparisonCards();

    // Default select fastest route (index 0)
    selectRouteOption(0);

    showToast(`Ruta calculada: ${formatDistance(routes[0].distanceKm)}`, 'success', 3000);

  } catch (err) {
    console.error('❌ [RutaCost] Error en el flujo de cálculo:', err);
    showToast(err.message || 'Error al calcular la ruta.', 'error', 5000);
  } finally {
    setMapLoading(false);
  }
}

/**
 * Renders the comparison cards between Fastest and Cheapest routes.
 */
function renderRouteComparisonCards() {
  if (!state.routesList || state.routesList.length === 0) return;

  elements.routePreferenceCard?.classList.remove('hidden');

  // Fastest route = index 0 (OSRM default)
  const fastest = state.routesList[0];
  if (elements.optFastestTime) elements.optFastestTime.innerText = formatDuration(fastest.durationMins);
  if (elements.optFastestCost) elements.optFastestCost.innerText = formatCLP(fastest.totalEvaluatedCost);

  // Cheapest route
  let cheapest = state.routesList[0];
  state.routesList.forEach(r => {
    if (r.totalEvaluatedCost < cheapest.totalEvaluatedCost) {
      cheapest = r;
    }
  });

  if (elements.optCheapestTime) elements.optCheapestTime.innerText = formatDuration(cheapest.durationMins);
  if (elements.optCheapestCost) elements.optCheapestCost.innerText = formatCLP(cheapest.totalEvaluatedCost);
}

/**
 * Switches the active route selection.
 */
function selectRouteOption(index) {
  if (!state.routesList[index]) return;

  state.activeRouteIndex = index;
  const activeRoute = state.routesList[index];

  // Update card UI active states
  if (index === 0) {
    elements.cardRouteFastest?.classList.add('active');
    elements.cardRouteCheapest?.classList.remove('active');
  } else {
    elements.cardRouteFastest?.classList.remove('active');
    elements.cardRouteCheapest?.classList.add('active');
  }

  // Update Map
  updateMapRoute(state.originCoords, state.destinationCoords, activeRoute.polyline, index === 0 ? '#3b82f6' : '#10b981');

  // Update Tolls & Results Breakdown
  state.detectedTolls = [...activeRoute.tolls];
  renderTollsListUI();
  renderCalculationResults();
}

/**
 * Renders itemized detected tolls list with editable price fields.
 */
function renderTollsListUI() {
  const container = elements.tollsListContainer;
  const badgeCount = elements.detectedTollsCount;
  if (!container) return;

  if (badgeCount) badgeCount.innerText = state.detectedTolls.length;

  if (state.detectedTolls.length === 0) {
    container.innerHTML = `<p class="empty-tolls-text">No se detectaron plazas de peaje ni pórticos TAG en esta ruta.</p>`;
    return;
  }

  container.innerHTML = '';
  state.detectedTolls.forEach((toll, idx) => {
    const item = document.createElement('div');
    item.className = 'toll-item';
    item.innerHTML = `
      <div class="toll-info">
        <span class="toll-name">${toll.name}</span>
        <span class="toll-highway">${toll.highway}</span>
      </div>
      <div class="toll-price-box">
        <input type="number" class="toll-price-input" data-index="${idx}" value="${toll.price}" step="100" min="0">
      </div>
    `;

    const input = item.querySelector('.toll-price-input');
    input.addEventListener('change', (e) => {
      const newPrice = parseFloat(e.target.value) || 0;
      state.detectedTolls[idx].price = newPrice;
      renderCalculationResults();
    });

    container.appendChild(item);
  });
}

/**
 * Computes math formulas and updates result DOM elements.
 */
function renderCalculationResults() {
  const activeRoute = state.routesList[state.activeRouteIndex];
  if (!activeRoute) return;

  const distanceKm = activeRoute.distanceKm;
  const durationMins = activeRoute.durationMins;

  const efficiency = parseFloat(elements.inputEfficiency?.value) || 12.5;
  const unit = elements.selectUnit?.value || 'kml';
  const pricePerLiter = parseFloat(elements.inputFuelPrice?.value) || 1320;
  const isRoundTrip = elements.checkboxRoundTrip?.checked || false;
  const passengers = parseInt(elements.inputPassengers?.value) || 1;

  const tollsCost = calculateTotalTollsCost(state.detectedTolls);

  const calculated = calculateTripCost({
    distanceKm,
    efficiency,
    unit,
    pricePerLiter,
    isRoundTrip,
    tollsCost,
    passengers
  });

  // DOM Updates
  if (elements.resTotalCost) elements.resTotalCost.innerText = formatCLP(calculated.totalCost);
  if (elements.resDistance) elements.resDistance.innerText = formatDistance(calculated.effectiveDistance);
  if (elements.resDuration) elements.resDuration.innerText = formatDuration(durationMins * (isRoundTrip ? 2 : 1));
  if (elements.resLiters) elements.resLiters.innerText = `${calculated.litersConsumed} L`;
  if (elements.resFuelCostOnly) elements.resFuelCostOnly.innerText = formatCLP(calculated.fuelCost);
  
  if (elements.tripTypeTag) {
    elements.tripTypeTag.innerText = isRoundTrip ? 'Ida y Vuelta (x2)' : 'Solo Ida';
  }

  // Passengers breakdown
  if (calculated.validPassengers > 1) {
    elements.passengerCostRow?.classList.remove('hidden');
    if (elements.resPassengerCount) elements.resPassengerCount.innerText = calculated.validPassengers;
    if (elements.resPassengerCost) elements.resPassengerCost.innerText = formatCLP(calculated.costPerPassenger);
  } else {
    elements.passengerCostRow?.classList.add('hidden');
  }

  // Formula details
  if (elements.fDist) elements.fDist.innerText = calculated.effectiveDistance.toFixed(1);
  if (elements.fEff) elements.fEff.innerText = calculated.efficiencyKmL.toFixed(1);
  if (elements.fPrice) elements.fPrice.innerText = pricePerLiter.toLocaleString('es-CL');
  if (elements.fResult) elements.fResult.innerText = formatCLP(calculated.fuelCost);
}
