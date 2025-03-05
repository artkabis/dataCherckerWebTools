// Fonction utilitaire pour récupérer les éléments par ID
const getById = (id) => document.getElementById(id);

// Boutons
const defaultBtn = getById("default-btn");
const saveBtn = getById("save-btn");

// Inputs options - Profil
const profilUserController = getById("profil-user-controller-input");
const roleInput = getById("profil-type-input");

// Inputs options - Meta données
const metaTitleMinInput = getById("min-meta-title-caractere-input");
const metaTitleMaxInput = getById("max-meta-title-caractere-input");
const metaDescMinInput = getById("min-meta-desc-caractere-input");
const metaDescMaxInput = getById("max-meta-desc-caractere-input");

// Inputs options - Structure du contenu
const hnCaractereMinInput = getById("min-hn-caractere-input");
const hnCaractereMaxInput = getById("max-hn-caractere-input");
const boldMinInput = getById("min-bold-expression-input");
const boldMaxInput = getById("max-bold-expression-input");

// Inputs options - Optimisation des images
const maxBytesImage = getById("max-size-bytes-image-input");
const maxRatioImage = getById("max-ratio-image-input");

// Paramètres par défaut
const defaultSettings = {
  PROFIL_USER_CONTROLLER: 'Customer',
  PROFIL_TYPE: 'CDP/WEB',
  MIN_META_TITLE_CARACTERE: 50,
  MAX_META_TITLE_CARACTERE: 65,
  MIN_META_DESC_CARACTERE: 140,
  MAX_META_DESC_CARACTERE: 156,
  MIN_HN_CARACTERE: 50,
  MAX_HN_CARACTERE: 90,
  MIN_BOLD_EXPRESSION: 3,
  MAX_BOLD_EXPRESSION: 5,
  MAX_SIZE_BYTES_IMAGE: 317435,
  MAX_RATIO_IMAGE: 3,
};

// Mise à jour d'un champ
const updateField = (key, value) => {
  const inputId = `${key.toLowerCase().replaceAll('_', '-')}-input`;
  const inputElement = getById(inputId);

  console.log('Mise à jour du champ:', inputId, value);

  if (inputElement && value !== null && value !== undefined) {
    inputElement.value = value;

    // Ajouter une classe pour indiquer que le champ a été mis à jour
    inputElement.classList.add('updated');
    setTimeout(() => {
      inputElement.classList.remove('updated');
    }, 1000);
  } else {
    console.warn(`Élément non trouvé ou valeur invalide: ${inputId}`, value);
  }
};

// Mise à jour de tous les champs
const updateAllFields = (savedSettings) => {
  console.log('Mise à jour de tous les champs avec les paramètres:', savedSettings);

  // Fusionner avec les paramètres par défaut
  const mergedSettings = { ...defaultSettings, ...savedSettings };
  console.log('Paramètres fusionnés:', mergedSettings);

  // Mise à jour des champs
  Object.entries(mergedSettings).forEach(([key, value]) => {
    if (key !== 'timestamp') {
      updateField(key, value);
    }
  });

  // Afficher un message de notification
  showNotification('Paramètres chargés avec succès', 'success');
};

// Mise à jour des paramètres dans le stockage
const updateCheckerToolsSettings = (key, value) => {
  chrome.storage.sync.get({ checkerToolsSettings: {} }, (result) => {
    const existingSettings = result.checkerToolsSettings || {};
    const currentTimestamp = Date.now();
    const newValues = { [key]: value, timestamp: currentTimestamp };

    // Fusionner avec les paramètres existants
    const mergedSettings = { ...existingSettings, ...newValues };
    console.log('Paramètres existants:', existingSettings);
    console.log('Nouveaux paramètres fusionnés:', mergedSettings);

    chrome.storage.sync.set({ checkerToolsSettings: mergedSettings }, () => {
      console.log('Paramètres enregistrés localement:', mergedSettings);
      showNotification('Paramètre mis à jour', 'success');
    });

    // Envoyer les paramètres mis à jour
    chrome.runtime.sendMessage({
      action: 'updateCheckerToolsSettings',
      newValues: mergedSettings,
    });
  });
};

// Sauvegarder tous les paramètres en une fois
const saveAllSettings = () => {
  const settings = {
    PROFIL_USER_CONTROLLER: profilUserController.value,
    PROFIL_TYPE: roleInput.value,
    MIN_META_TITLE_CARACTERE: Number(metaTitleMinInput.value),
    MAX_META_TITLE_CARACTERE: Number(metaTitleMaxInput.value),
    MIN_META_DESC_CARACTERE: Number(metaDescMinInput.value),
    MAX_META_DESC_CARACTERE: Number(metaDescMaxInput.value),
    MIN_HN_CARACTERE: Number(hnCaractereMinInput.value),
    MAX_HN_CARACTERE: Number(hnCaractereMaxInput.value),
    MIN_BOLD_EXPRESSION: Number(boldMinInput.value),
    MAX_BOLD_EXPRESSION: Number(boldMaxInput.value),
    MAX_SIZE_BYTES_IMAGE: Number(maxBytesImage.value),
    MAX_RATIO_IMAGE: Number(maxRatioImage.value),
    timestamp: Date.now()
  };

  chrome.storage.sync.set({ checkerToolsSettings: settings }, () => {
    console.log('Tous les paramètres ont été enregistrés:', settings);
    showNotification('Tous les paramètres ont été enregistrés avec succès', 'success');

    // Envoyer tous les paramètres mis à jour
    chrome.runtime.sendMessage({
      action: 'updateCheckerToolsSettings',
      newValues: settings,
    });
  });
};

// Réinitialiser les paramètres
const resetSettings = () => {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
    chrome.storage.sync.remove('checkerToolsSettings', function () {
      console.log('checkerToolsSettings supprimé du stockage sync');

      chrome.storage.local.remove('checkerToolsSettings', function () {
        console.log('checkerToolsSettings supprimé du stockage local');

        // Appliquer les paramètres par défaut
        updateAllFields({});
        showNotification('Paramètres réinitialisés avec succès', 'warning');
      });
    });
  }
};

// Créer et afficher une notification
const showNotification = (message, type = 'info') => {
  // Supprimer toute notification existante
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Créer l'élément de notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;

  // Ajouter les styles
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = type === 'success' ? '#4cc9f0' : type === 'warning' ? '#ffd166' : '#4361ee';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  notification.style.minWidth = '300px';
  notification.style.zIndex = '1000';
  notification.style.animation = 'slideIn 0.3s ease forwards';

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
      display: flex;
      align-items: center;
    }
    
    .notification-content i {
      margin-right: 10px;
    }
    
    .notification-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 5px;
    }
  `;
  document.head.appendChild(style);

  // Ajouter la notification au document
  document.body.appendChild(notification);

  // Gérer la fermeture de la notification
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Masquer automatiquement après 5 secondes
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
};

// Événement de chargement du document
document.addEventListener('DOMContentLoaded', () => {
  // Charger les paramètres enregistrés
  chrome.storage.sync.get({ checkerToolsSettings: {} }, (result) => {
    const savedSettings = result.checkerToolsSettings || {};
    updateAllFields(savedSettings);
  });

  // Validation pour assurer que min < max
  const validateMinMax = (minInput, maxInput) => {
    const minValue = Number(minInput.value);
    const maxValue = Number(maxInput.value);

    if (minValue && maxValue && minValue > maxValue) {
      showNotification('Erreur: La valeur minimale ne peut pas être supérieure à la valeur maximale', 'warning');
      return false;
    }

    return true;
  };

  // Ajout des validations pour les paires min/max
  metaTitleMaxInput.addEventListener('change', () => {
    if (validateMinMax(metaTitleMinInput, metaTitleMaxInput)) {
      updateCheckerToolsSettings('MAX_META_TITLE_CARACTERE', Number(metaTitleMaxInput.value));
    }
  });

  metaTitleMinInput.addEventListener('change', () => {
    if (validateMinMax(metaTitleMinInput, metaTitleMaxInput)) {
      updateCheckerToolsSettings('MIN_META_TITLE_CARACTERE', Number(metaTitleMinInput.value));
    }
  });

  metaDescMaxInput.addEventListener('change', () => {
    if (validateMinMax(metaDescMinInput, metaDescMaxInput)) {
      updateCheckerToolsSettings('MAX_META_DESC_CARACTERE', Number(metaDescMaxInput.value));
    }
  });

  metaDescMinInput.addEventListener('change', () => {
    if (validateMinMax(metaDescMinInput, metaDescMaxInput)) {
      updateCheckerToolsSettings('MIN_META_DESC_CARACTERE', Number(metaDescMinInput.value));
    }
  });

  hnCaractereMaxInput.addEventListener('change', () => {
    if (validateMinMax(hnCaractereMinInput, hnCaractereMaxInput)) {
      updateCheckerToolsSettings('MAX_HN_CARACTERE', Number(hnCaractereMaxInput.value));
    }
  });

  hnCaractereMinInput.addEventListener('change', () => {
    if (validateMinMax(hnCaractereMinInput, hnCaractereMaxInput)) {
      updateCheckerToolsSettings('MIN_HN_CARACTERE', Number(hnCaractereMinInput.value));
    }
  });

  boldMaxInput.addEventListener('change', () => {
    if (validateMinMax(boldMinInput, boldMaxInput)) {
      updateCheckerToolsSettings('MAX_BOLD_EXPRESSION', Number(boldMaxInput.value));
    }
  });

  boldMinInput.addEventListener('change', () => {
    if (validateMinMax(boldMinInput, boldMaxInput)) {
      updateCheckerToolsSettings('MIN_BOLD_EXPRESSION', Number(boldMinInput.value));
    }
  });
});

// Écoute de la réception de messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateCheckerToolsSettings') {
    updateAllFields(request.newValues);
  }
});

// Événements pour les champs simples sans validation min/max
profilUserController.addEventListener('change', () =>
  updateCheckerToolsSettings('PROFIL_USER_CONTROLLER', profilUserController.value)
);
roleInput.addEventListener('change', () =>
  updateCheckerToolsSettings('PROFIL_TYPE', roleInput.value)
);
maxBytesImage.addEventListener('change', () =>
  updateCheckerToolsSettings('MAX_SIZE_BYTES_IMAGE', Number(maxBytesImage.value))
);
maxRatioImage.addEventListener('change', () =>
  updateCheckerToolsSettings('MAX_RATIO_IMAGE', Number(maxRatioImage.value))
);

// Événement pour le bouton de réinitialisation
defaultBtn.addEventListener('click', resetSettings);

// Événement pour le bouton de sauvegarde
if (saveBtn) {
  saveBtn.addEventListener('click', saveAllSettings);
}