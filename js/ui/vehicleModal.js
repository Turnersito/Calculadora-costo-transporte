import { getSavedVehicles, addVehicle, deleteVehicle, getActiveVehicleId, setActiveVehicleId } from '../services/storage.js';
import { showToast } from './toast.js';

let onVehicleChangedCallback = null;
let currentUploadedBase64 = null;

/**
 * Initializes vehicle modal listeners, photo uploader, and dropdown options.
 */
export function initVehicleModal(onVehicleChanged) {
  onVehicleChangedCallback = onVehicleChanged;

  const btnManage = document.getElementById('btnManageVehicles');
  const modal = document.getElementById('vehicleModal');
  const btnClose = document.getElementById('btnCloseVehicleModal');
  const selectVehicle = document.getElementById('selectVehicle');
  const newForm = document.getElementById('newVehicleForm');
  const photoInput = document.getElementById('newVehiclePhoto');
  const photoPreview = document.getElementById('newVehiclePhotoPreview');

  // Open modal
  btnManage?.addEventListener('click', () => {
    renderVehicleList();
    modal?.classList.remove('hidden');
  });

  // Close modal
  btnClose?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Select vehicle change event
  selectVehicle?.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    setActiveVehicleId(selectedId);
    triggerVehicleSelectionChange(selectedId);
  });

  // Handle Photo File Upload
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('La foto debe pesar menos de 2MB.', 'error');
      photoInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      currentUploadedBase64 = event.target.result;
      if (photoPreview) {
        photoPreview.src = currentUploadedBase64;
        photoPreview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  });

  // Form submit for adding new vehicle
  newForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newVehicleName')?.value;
    const efficiency = document.getElementById('newVehicleEff')?.value;
    const unit = document.getElementById('newVehicleUnit')?.value;
    const fuelType = document.getElementById('newVehicleFuel')?.value;

    if (!name || !efficiency) return;

    try {
      const added = addVehicle({ 
        name, 
        efficiency, 
        unit, 
        fuelType,
        photoBase64: currentUploadedBase64
      });

      setActiveVehicleId(added.id);
      renderVehicleList();
      populateVehicleSelect();
      triggerVehicleSelectionChange(added.id);
      
      showToast(`Vehículo "${name}" guardado con éxito.`, 'success');
      newForm.reset();
      currentUploadedBase64 = null;
      if (photoPreview) photoPreview.classList.add('hidden');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  populateVehicleSelect();
}

/**
 * Populates the main form's vehicle select dropdown.
 */
export function populateVehicleSelect() {
  const selectVehicle = document.getElementById('selectVehicle');
  const badgeCount = document.getElementById('vehicleCountBadge');
  if (!selectVehicle) return;

  const vehicles = getSavedVehicles();
  const activeId = getActiveVehicleId();

  if (badgeCount) badgeCount.innerText = vehicles.length;

  selectVehicle.innerHTML = '';
  vehicles.forEach(v => {
    const option = document.createElement('option');
    option.value = v.id;
    option.textContent = `${v.name} (${v.efficiency} ${v.unit === 'kml' ? 'km/L' : 'L/100km'})`;
    if (v.id === activeId) option.selected = true;
    selectVehicle.appendChild(option);
  });
}

/**
 * Renders list of saved vehicles inside management modal with photo thumbnails.
 */
function renderVehicleList() {
  const container = document.getElementById('vehicleList');
  if (!container) return;

  const vehicles = getSavedVehicles();
  const activeId = getActiveVehicleId();

  container.innerHTML = '';
  vehicles.forEach(v => {
    const item = document.createElement('div');
    item.className = `vehicle-item ${v.id === activeId ? 'active' : ''}`;
    item.innerHTML = `
      <div class="vehicle-avatar">
        ${v.photoBase64 
          ? `<img src="${v.photoBase64}" alt="${v.name}" class="avatar-img">`
          : `<div class="avatar-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`
        }
      </div>
      <div class="vehicle-info">
        <h5>${v.name} ${v.id === activeId ? '<span class="badge tag-blue">Activo</span>' : ''}</h5>
        <p>Rendimiento: ${v.efficiency} ${v.unit === 'kml' ? 'km/L' : 'L/100km'} | Combustible: ${v.fuelType}</p>
      </div>
      <div class="vehicle-actions">
        ${vehicles.length > 1 ? `<button type="button" class="btn-delete-vehicle" data-id="${v.id}" title="Eliminar">&times;</button>` : ''}
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('btn-delete-vehicle')) {
        setActiveVehicleId(v.id);
        renderVehicleList();
        populateVehicleSelect();
        triggerVehicleSelectionChange(v.id);
      }
    });

    const btnDel = item.querySelector('.btn-delete-vehicle');
    btnDel?.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        deleteVehicle(v.id);
        renderVehicleList();
        populateVehicleSelect();
        showToast('Vehículo eliminado.', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    container.appendChild(item);
  });
}

function triggerVehicleSelectionChange(vehicleId) {
  const vehicles = getSavedVehicles();
  const found = vehicles.find(v => v.id === vehicleId);
  if (found && onVehicleChangedCallback) {
    onVehicleChangedCallback(found);
  }
}
