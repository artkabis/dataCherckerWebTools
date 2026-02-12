/**
 * Content Script Principal - v5.0
 * Écoute les messages du service worker et extrait les données de la page
 * Note: Tous les scripts API sont chargés automatiquement via manifest.json
 */

console.log('[Content Script] Web Quality Analyzer v5.0 loaded');

// Vérifier que toutes les classes sont disponibles
console.log('[Content Script] Classes disponibles:', {
  DataExtractor: typeof DataExtractor !== 'undefined',
  ConfigurationManager: typeof ConfigurationManager !== 'undefined',
  AnalysisOrchestrator: typeof AnalysisOrchestrator !== 'undefined'
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

    // Vérifier que les classes sont disponibles
    if (typeof DataExtractor === 'undefined' || typeof AnalysisOrchestrator === 'undefined') {
      throw new Error('Required classes not loaded. Please reload the page.');
    }

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

    // Vérifier que les classes sont disponibles
    if (typeof DataExtractor === 'undefined') {
      throw new Error('DataExtractor not loaded. Please reload the page.');
    }

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
 * Vérifie que toutes les classes nécessaires sont chargées
 */
function checkAllClassesLoaded() {
  const classes = {
    DataExtractor,
    ConfigurationManager,
    ScoringEngine,
    AnalyzerEndpoint,
    MetaAnalyzerEndpoint,
    ImageAnalyzerEndpoint,
    HeadingAnalyzerEndpoint,
    LinkAnalyzerEndpoint,
    AccessibilityAnalyzerEndpoint,
    PerformanceAnalyzerEndpoint,
    AnalysisOrchestrator
  };

  const missing = Object.keys(classes).filter(name => typeof classes[name] === 'undefined');

  if (missing.length > 0) {
    console.error('[Content Script] Missing classes:', missing);
    return false;
  }

  console.log('[Content Script] All classes loaded successfully');
  return true;
}

/**
 * Notifier que le content script est prêt
 */
window.addEventListener('load', () => {
  console.log('[Content Script] Page loaded, checking classes...');
  checkAllClassesLoaded();
});

// Debug helper
window.__webQualityAnalyzer = {
  version: '5.0.0',
  checkClasses: () => checkAllClassesLoaded(),
  extractPageData: async () => {
    if (!checkAllClassesLoaded()) {
      throw new Error('Required classes not loaded');
    }
    const extractor = new DataExtractor();
    return await extractor.extractAll();
  },
  analyzeCurrentPage: async () => {
    if (!checkAllClassesLoaded()) {
      throw new Error('Required classes not loaded');
    }
    const extractor = new DataExtractor();
    const pageData = await extractor.extractAll();
    const orchestrator = new AnalysisOrchestrator();
    await orchestrator.init();
    return await orchestrator.analyzePage(pageData);
  }
};
