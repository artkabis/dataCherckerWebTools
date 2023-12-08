// Paramètres par défaut
const defaultSettings = {
  PROFIL_USER_CONTROLLER:'Customer',
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
let currentSettings = { ...defaultSettings };  // Initialisez avec les paramètres par défaut
// Fonction pour récupérer les paramètres du stockage local
const getSettings = (callback) => {
  chrome.storage.sync.get({ checkerToolsSettings: {} }, (result) => {
    const settings = result.checkerToolsSettings;
    callback(settings);
  });
};

getSettings((settings) => {
  // console.log('Settings retrieved:', settings);
  // console.log('defaultSettings : ',defaultSettings);
  currentSettings = { ...defaultSettings, ...settings };

  console.log('settings option DTU : ',currentSettings);
  return currentSettings;
});

// Ajoutez un écouteur d'événements pour écouter les mises à jour des paramètres
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateCheckerToolsSettings') {
      console.log('current settings before update : ',defaultSettings);
    // Les paramètres ont été mis à jour, vous pouvez les récupérer ici
    currentSettings = { ...currentSettings, ...request.newValues };
    console.log('Settings updated in content script:', currentSettings);
  }
});
