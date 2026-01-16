/**
 * Content Script Principal - v5.0
 * Écoute les messages du service worker et extrait les données de la page
 */

console.log('[Content Script] Web Quality Analyzer v5.0 loaded');

// Charger le DataExtractor
const script = document.createElement('script');
script.src = chrome.runtime.getURL('api/extractors/DataExtractor.js');
document.head.appendChild(script);

// État global
let isAnalyzing = false;

/**
 * Écouter les messages du service worker
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Message received:', message);

  if (message.action === 'analyzePagepData') {
    handleAnalyzePageRequest(sendResponse);
    return true; // Indique une réponse asynchrone
  }

  if (message.action === 'getPageData') {
    handleGetPageData(sendResponse);
    return true;
  }

  if (message.action === 'ping') {
    sendResponse({ status: 'ready' });
    return false;
  }
});

/**
 * Gère la requête d'analyse complète
 */
async function handleAnalyzePageRequest(sendResponse) {
  if (isAnalyzing) {
    sendResponse({
      success: false,
      error: 'Analysis already in progress'
    });
    return;
  }

  try {
    isAnalyzing = true;
    console.log('[Content Script] Starting page analysis...');

    // Attendre que DataExtractor soit chargé
    await waitForDataExtractor();

    // Créer l'extracteur
    const extractor = new DataExtractor();

    // Extraire toutes les données
    const pageData = await extractor.extractAll();

    console.log('[Content Script] Page data extracted:', pageData);

    // Envoyer au service worker pour analyse
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeWithEndpoints',
      pageData: pageData
    });

    sendResponse({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('[Content Script] Analysis error:', error);
    sendResponse({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    isAnalyzing = false;
  }
}

/**
 * Gère la requête de récupération des données brutes
 */
async function handleGetPageData(sendResponse) {
  try {
    console.log('[Content Script] Extracting page data...');

    // Attendre que DataExtractor soit chargé
    await waitForDataExtractor();

    const extractor = new DataExtractor();
    const pageData = await extractor.extractAll();

    sendResponse({
      success: true,
      data: pageData
    });

  } catch (error) {
    console.error('[Content Script] Data extraction error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Attend que DataExtractor soit disponible
 */
function waitForDataExtractor(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (typeof DataExtractor !== 'undefined') {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('DataExtractor failed to load'));
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
}

/**
 * Notifier que le content script est prêt
 */
window.addEventListener('load', () => {
  console.log('[Content Script] Page loaded, ready for analysis');
});

// Debug helper
window.__webQualityAnalyzer = {
  version: '5.0.0',
  extractPageData: async () => {
    await waitForDataExtractor();
    const extractor = new DataExtractor();
    return await extractor.extractAll();
  }
};
