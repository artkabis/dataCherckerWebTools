const getById = (id) => document.getElementById(id);
const deafultBtn = getById("default-btn");


//Inputs option
const profilUserController = getById("profil-user-controller-input");
const roleInput = getById("profil-type-input");
const metaTitleMinInput = getById("min-meta-title-caractere-input");
const metaTitleMaxInput = getById("max-meta-title-caractere-input");
const metaDescMinInput = getById("min-meta-desc-caractere-input");
const metaDescMaxInput = getById("max-meta-desc-caractere-input");
const hnCaractereMinInput = getById("min-hn-caractere-input");
const hnCaractereMaxInput = getById("max-hn-caractere-input");
const boldMinInput = getById("min-bold-expression-input");
const boldMaxInput = getById("max-bold-expression-input");
const maxBytesImage = getById("max-size-bytes-image-input");
const maxRatioImage = getById("max-ratio-image-input");

const updateField = (key, value) => {
  const inputElement = getById(`${key.toLowerCase().replaceAll('_', '-')}-input`);
  console.log('input change node : ' + inputElement, 'selecteur reconstruit : ' + `${key.toLowerCase().replaceAll('_', '-')}-input`);
  if (inputElement && value !== null && value !== undefined) {
    inputElement.value = value;
  }
};

const updateAllFields = (savedSettings) => {
  console.log('before loop - settings : ', savedSettings);

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

  // Fusionner avec les paramètres par défaut
  const mergedSettings = { ...defaultSettings, ...savedSettings };
  console.log({mergedSettings});

  Object.entries(mergedSettings).forEach(([key, value]) => {
    console.log('loop update : ', key, value);
    console.log('Generated ID: ', `${key.toLowerCase().replaceAll('_', '-')}-input`);
    if (key !== 'timestamp') {
      updateField(key, value);
    }
  });


};

const updateCheckerToolsSettings = (key, value) => {
  chrome.storage.sync.get({ checkerToolsSettings: {} }, (result) => {
    const existingSettings = result.checkerToolsSettings || {};
    const currentTimestamp = Date.now();
    const newValues = { [key]: value, timestamp: currentTimestamp };

    // Fusionner avec les paramètres existants
    const mergedSettings = { ...existingSettings, ...newValues };
    console.log({existingSettings},{mergedSettings});

    chrome.storage.sync.set({ checkerToolsSettings: mergedSettings }, () => {
      console.log('Settings saved locally:', mergedSettings);
    });

    // Ajoutez les paramètres mis à jour dans le message
    chrome.runtime.sendMessage({
      action: 'updateCheckerToolsSettings',
      newValues: mergedSettings,
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ checkerToolsSettings: {} }, (result) => {
    const savedSettings = result.checkerToolsSettings || {};
    updateAllFields(savedSettings);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateCheckerToolsSettings') {
    updateAllFields(request.newValues);
  }
});
profilUserController.addEventListener('change', () => updateCheckerToolsSettings('PROFIL_USER_CONTROLLER', profilUserController.value));
roleInput.addEventListener('change', () => updateCheckerToolsSettings('PROFIL_TYPE', roleInput.value));
metaTitleMinInput.addEventListener('change', () => updateCheckerToolsSettings('MIN_META_TITLE_CARACTERE', Number(metaTitleMinInput.value)));
metaTitleMaxInput.addEventListener('change', () => updateCheckerToolsSettings('MAX_META_TITLE_CARACTERE', Number(metaTitleMaxInput.value)));
metaDescMinInput.addEventListener('change', () => updateCheckerToolsSettings('MIN_META_DESC_CARACTERE', Number(metaDescMinInput.value)));
metaDescMaxInput.addEventListener('change', () => updateCheckerToolsSettings('MAX_META_DESC_CARACTERE', Number(metaDescMaxInput.value)));
hnCaractereMinInput.addEventListener('change', () => updateCheckerToolsSettings('MIN_HN_CARACTERE', Number(hnCaractereMinInput.value)));
hnCaractereMaxInput.addEventListener('change', () => updateCheckerToolsSettings('MAX_HN_CARACTERE', Number(hnCaractereMaxInput.value)));
boldMinInput.addEventListener('change', () => updateCheckerToolsSettings('MIN_BOLD_EXPRESSION', Number(boldMinInput.value)));
boldMaxInput.addEventListener('change', () => updateCheckerToolsSettings('MAX_BOLD_EXPRESSION', Number(boldMaxInput.value)));
maxBytesImage.addEventListener('change', () => updateCheckerToolsSettings('MAX_SIZE_BYTES_IMAGE', Number(maxBytesImage.value)));
maxRatioImage.addEventListener('change', () => updateCheckerToolsSettings('MAX_RATIO_IMAGE', Number(maxRatioImage.value)));




deafultBtn.addEventListener('click', () => {
  chrome.storage.sync.remove('checkerToolsSettings', function () {
    console.log('checkerToolsSettings supprimé du stockage sync');
  });

  chrome.storage.local.remove('checkerToolsSettings', function () {
    console.log('checkerToolsSettings supprimé du stockage local');
  });
});

