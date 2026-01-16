/**
 * Content Script Principal - v5.0
 * Écoute les messages du service worker et extrait les données de la page
 */

console.log('[Content Script] Web Quality Analyzer v5.0 loaded');

// Charger tous les scripts nécessaires pour l'analyse
const scriptsToLoad = [
  'api/extractors/DataExtractor.js',
  'api/config/ConfigurationManager.js',
  'api/core/ScoringEngine.js',
  'api/core/AnalyzerEndpoint.js',
  'api/endpoints/MetaAnalyzerEndpoint.js',
  'api/endpoints/ImageAnalyzerEndpoint.js',
  'api/endpoints/HeadingAnalyzerEndpoint.js',
  'api/endpoints/LinkAnalyzerEndpoint.js',
  'api/endpoints/AccessibilityAnalyzerEndpoint.js',
  'api/endpoints/PerformanceAnalyzerEndpoint.js',
  'api/core/AnalysisOrchestrator.js'
];

// Charger tous les scripts dans l'ordre
scriptsToLoad.forEach(scriptPath => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(scriptPath);
  document.head.appendChild(script);
});

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

    // Attendre que tous les scripts soient chargés
    await waitForScriptsToLoad();

    // Créer l'extracteur
    const extractor = new DataExtractor();

    // Extraire toutes les données
    const pageData = await extractor.extractAll();

    console.log('[Content Script] Page data extracted:', pageData);

    // Créer l'orchestrateur et analyser sur place
    const orchestrator = new AnalysisOrchestrator();
    await orchestrator.init();

    // Analyser la page
    const analysisResult = await orchestrator.analyzePage(pageData);

    console.log('[Content Script] Analysis complete:', analysisResult);

    sendResponse({
      success: true,
      data: analysisResult
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

    // Attendre que tous les scripts soient chargés
    await waitForScriptsToLoad();

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
 * Attend que tous les scripts nécessaires soient chargés
 */
function waitForScriptsToLoad(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      // Vérifier que toutes les classes nécessaires sont disponibles
      const allLoaded =
        typeof DataExtractor !== 'undefined' &&
        typeof ConfigurationManager !== 'undefined' &&
        typeof ScoringEngine !== 'undefined' &&
        typeof AnalyzerEndpoint !== 'undefined' &&
        typeof MetaAnalyzerEndpoint !== 'undefined' &&
        typeof ImageAnalyzerEndpoint !== 'undefined' &&
        typeof HeadingAnalyzerEndpoint !== 'undefined' &&
        typeof LinkAnalyzerEndpoint !== 'undefined' &&
        typeof AccessibilityAnalyzerEndpoint !== 'undefined' &&
        typeof PerformanceAnalyzerEndpoint !== 'undefined' &&
        typeof AnalysisOrchestrator !== 'undefined';

      if (allLoaded) {
        console.log('[Content Script] All scripts loaded successfully');
        resolve();
      } else if (Date.now() - startTime > timeout) {
        // Lister les scripts manquants
        const missing = [];
        if (typeof DataExtractor === 'undefined') missing.push('DataExtractor');
        if (typeof ConfigurationManager === 'undefined') missing.push('ConfigurationManager');
        if (typeof ScoringEngine === 'undefined') missing.push('ScoringEngine');
        if (typeof AnalyzerEndpoint === 'undefined') missing.push('AnalyzerEndpoint');
        if (typeof MetaAnalyzerEndpoint === 'undefined') missing.push('MetaAnalyzerEndpoint');
        if (typeof ImageAnalyzerEndpoint === 'undefined') missing.push('ImageAnalyzerEndpoint');
        if (typeof HeadingAnalyzerEndpoint === 'undefined') missing.push('HeadingAnalyzerEndpoint');
        if (typeof LinkAnalyzerEndpoint === 'undefined') missing.push('LinkAnalyzerEndpoint');
        if (typeof AccessibilityAnalyzerEndpoint === 'undefined') missing.push('AccessibilityAnalyzerEndpoint');
        if (typeof PerformanceAnalyzerEndpoint === 'undefined') missing.push('PerformanceAnalyzerEndpoint');
        if (typeof AnalysisOrchestrator === 'undefined') missing.push('AnalysisOrchestrator');

        reject(new Error(`Scripts failed to load: ${missing.join(', ')}`));
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
    await waitForScriptsToLoad();
    const extractor = new DataExtractor();
    return await extractor.extractAll();
  },
  analyzeCurrentPage: async () => {
    await waitForScriptsToLoad();
    const extractor = new DataExtractor();
    const pageData = await extractor.extractAll();
    const orchestrator = new AnalysisOrchestrator();
    await orchestrator.init();
    return await orchestrator.analyzePage(pageData);
  }
};
