import { CONFIG } from '../config.js';

const STORAGE_KEYS = {
  VEHICLES: 'rutacost_vehicles_v1',
  SELECTED_VEHICLE_ID: 'rutacost_selected_vehicle_id_v1',
  SETTINGS: 'rutacost_user_settings_v1'
};

/**
 * Retrieves saved vehicle profiles from localStorage.
 */
export function getSavedVehicles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(CONFIG.DEFAULT_VEHICLES));
      return CONFIG.DEFAULT_VEHICLES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading localStorage vehicles:', err);
    return CONFIG.DEFAULT_VEHICLES;
  }
}

/**
 * Saves vehicles array to localStorage.
 */
export function saveVehicles(vehicles) {
  try {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  } catch (err) {
    console.error('Error saving vehicles to localStorage:', err);
  }
}

/**
 * Adds a new vehicle profile to localStorage with optional Base64 photo.
 */
export function addVehicle(newVehicleData) {
  const vehicles = getSavedVehicles();
  const vehicle = {
    id: `v-${Date.now()}`,
    name: newVehicleData.name || 'Mi Vehículo',
    efficiency: parseFloat(newVehicleData.efficiency) || 12.0,
    unit: newVehicleData.unit || 'kml',
    fuelType: newVehicleData.fuelType || '95',
    photoBase64: newVehicleData.photoBase64 || null,
    isDefault: false
  };
  vehicles.push(vehicle);
  saveVehicles(vehicles);
  return vehicle;
}

/**
 * Updates properties of an existing vehicle profile.
 */
export function updateVehicle(vehicleId, updatedFields) {
  const vehicles = getSavedVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...updatedFields };
    saveVehicles(vehicles);
    return vehicles[index];
  }
  return null;
}

/**
 * Deletes a vehicle by ID from localStorage.
 */
export function deleteVehicle(vehicleId) {
  let vehicles = getSavedVehicles();
  if (vehicles.length <= 1) {
    throw new Error('Debes mantener al menos un vehículo en tu lista.');
  }
  vehicles = vehicles.filter(v => v.id !== vehicleId);
  saveVehicles(vehicles);
  return vehicles;
}

/**
 * Gets active vehicle ID.
 */
export function getActiveVehicleId() {
  const savedId = localStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE_ID);
  const vehicles = getSavedVehicles();
  const exists = vehicles.some(v => v.id === savedId);
  if (exists) return savedId;
  return vehicles[0]?.id || '';
}

/**
 * Sets active vehicle ID.
 */
export function setActiveVehicleId(vehicleId) {
  localStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE_ID, vehicleId);
}
