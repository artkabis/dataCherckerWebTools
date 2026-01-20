/**
 * Test Helper - Utilitaires pour tester l'Offscreen Batch Analyzer
 * À exécuter dans la console DevTools
 */

// =============================================================================
// HELPERS DE TEST
// =============================================================================

const TestHelper = {
  /**
   * Vérifier l'état de l'extension
   */
  async checkExtensionState() {
    console.group('🔍 Extension State Check');

    // Permissions
    const manifest = chrome.runtime.getManifest();
    console.log('✓ Permissions:', manifest.permissions);
    console.log('  → Has offscreen:', manifest.permissions.includes('offscreen'));

    // Storage
    const storage = await chrome.storage.local.get(null);
    console.log('✓ Storage keys:', Object.keys(storage));
    console.log('  → Has offscreenBatchResults:', !!storage.offscreenBatchResults);

    // CORS state
    chrome.runtime.sendMessage({ action: 'getCORSStatus' }, (state) => {
      console.log('✓ CORS state:', state);
    });

    console.groupEnd();
  },

  /**
   * Lancer un test rapide avec 3 URLs
   */
  async quickTest() {
    console.group('⚡ Quick Test - 3 URLs');

    const urls = [
      'https://example.com',
      'https://example.org',
      'https://example.net'
    ];

    console.log('Testing with URLs:', urls);
    console.log('Method: Offscreen');
    console.time('Analysis Duration');

    chrome.runtime.sendMessage({
      action: 'startOffscreenBatchAnalysis',
      urls,
      config: {
        autoDetect: false,
        preferOffscreen: true,
        maxConcurrentOffscreen: 5
      }
    }, (response) => {
      console.timeEnd('Analysis Duration');

      if (response && response.success) {
        console.log('✅ SUCCESS!');
        console.log('Stats:', response.stats);
        console.log('Results:', response.results.length, 'pages analyzed');
        console.log('Errors:', response.errors.length);

        if (response.results.length > 0) {
          console.log('Sample result:', response.results[0]);
        }
      } else {
        console.error('❌ FAILED:', response?.error);
      }

      console.groupEnd();
    });

    console.log('⏳ Analysis started... waiting for completion');
  },

  /**
   * Test de détection automatique
   */
  async testAutoDetection() {
    console.group('🤖 Auto Detection Test');

    const urls = [
      'https://example.com',        // Static
      'https://react.dev',          // React (dynamic)
      'https://nextjs.org',         // Next.js (dynamic)
      'https://wikipedia.org'       // Static
    ];

    console.log('Testing detection with:', urls);
    console.time('Detection Time');

    chrome.runtime.sendMessage({
      action: 'startOffscreenBatchAnalysis',
      urls,
      config: {
        autoDetect: true,  // Important !
        preferOffscreen: true
      }
    }, (response) => {
      console.timeEnd('Detection Time');

      if (response && response.success) {
        console.log('✅ Detection complete');
        console.log('Stats:', response.stats);
        console.log('  → Offscreen:', response.stats.offscreenCount);
        console.log('  → Tabs:', response.stats.tabCount);
      } else {
        console.error('❌ Detection failed:', response?.error);
      }

      console.groupEnd();
    });
  },

  /**
   * Test avec sitemap
   */
  async testSitemap(sitemapUrl = 'https://www.sitemaps.org/sitemap.xml') {
    console.group('🗺️ Sitemap Test');

    console.log('Sitemap URL:', sitemapUrl);
    console.time('Sitemap Analysis');

    chrome.runtime.sendMessage({
      action: 'startOffscreenBatchAnalysis',
      sitemapUrl,
      config: {
        autoDetect: true,
        maxConcurrentOffscreen: 5
      }
    }, (response) => {
      console.timeEnd('Sitemap Analysis');

      if (response && response.success) {
        console.log('✅ Sitemap analysis complete');
        console.log('Stats:', response.stats);
        console.table([
          { metric: 'Total', value: response.stats.total },
          { metric: 'Success', value: response.stats.success },
          { metric: 'Errors', value: response.stats.errors },
          { metric: 'Offscreen', value: response.stats.offscreenCount },
          { metric: 'Tabs', value: response.stats.tabCount },
          { metric: 'Avg Score', value: response.stats.averageScore },
          { metric: 'Duration', value: response.stats.duration + 'ms' }
        ]);
      } else {
        console.error('❌ Sitemap analysis failed:', response?.error);
      }

      console.groupEnd();
    });
  },

  /**
   * Afficher les derniers résultats
   */
  async showLastResults() {
    const data = await chrome.storage.local.get(['offscreenBatchResults']);

    if (!data.offscreenBatchResults) {
      console.warn('⚠️ No results found in storage');
      return;
    }

    console.group('📊 Last Results');
    const results = data.offscreenBatchResults;

    console.log('Stats:', results.stats);
    console.log('Success count:', results.success.length);
    console.log('Error count:', results.errors.length);

    if (results.success.length > 0) {
      console.table(results.success.map(r => ({
        url: r.url,
        score: r.score,
        title: r.meta?.title,
        h1: r.headings?.h1.length,
        images: r.images?.count,
        links: r.links?.count
      })));
    }

    if (results.errors.length > 0) {
      console.warn('Errors:', results.errors);
    }

    console.groupEnd();
  },

  /**
   * Nettoyer le storage
   */
  async clearResults() {
    await chrome.storage.local.remove(['offscreenBatchResults']);
    console.log('✅ Results cleared');
  },

  /**
   * Benchmark performance
   */
  async benchmark() {
    console.group('📊 Performance Benchmark');

    const testUrls = [
      'https://example.com',
      'https://example.org',
      'https://example.net',
      'https://wikipedia.org',
      'https://github.com'
    ];

    // Test 1: Offscreen
    console.log('🚀 Test 1: Offscreen method');
    console.time('Offscreen Total');

    const offscreenPromise = new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'startOffscreenBatchAnalysis',
        urls: testUrls,
        config: {
          autoDetect: false,
          preferOffscreen: true
        }
      }, (response) => {
        console.timeEnd('Offscreen Total');
        resolve(response);
      });
    });

    const offscreenResult = await offscreenPromise;

    // Wait a bit
    await new Promise(r => setTimeout(r, 3000));

    // Test 2: Tabs
    console.log('🔖 Test 2: Tabs method');
    console.time('Tabs Total');

    const tabsPromise = new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'startBatchAnalysisV5',  // Old method
        type: 'urlList',
        data: testUrls.join(','),
        options: { concurrent: 3 }
      }, (response) => {
        console.timeEnd('Tabs Total');
        resolve(response);
      });
    });

    const tabsResult = await tabsPromise;

    // Comparison
    console.table([
      {
        method: 'Offscreen',
        duration: offscreenResult?.stats?.duration + 'ms',
        success: offscreenResult?.stats?.success,
        avgScore: offscreenResult?.stats?.averageScore
      },
      {
        method: 'Tabs',
        duration: tabsResult?.stats?.duration + 'ms',
        success: tabsResult?.stats?.success,
        avgScore: tabsResult?.stats?.averageScore
      }
    ]);

    const speedup = (tabsResult?.stats?.duration / offscreenResult?.stats?.duration).toFixed(2);
    console.log(`✨ Offscreen is ${speedup}x faster!`);

    console.groupEnd();
  },

  /**
   * Tester gestion d'erreurs
   */
  async testErrors() {
    console.group('🐛 Error Handling Test');

    const urls = [
      'https://example.com',                              // Valid
      'https://this-domain-does-not-exist-12345.com',    // Invalid
      'https://example.org',                              // Valid
      'https://httpstat.us/500'                           // 500 error
    ];

    console.log('Testing error handling with:', urls);

    chrome.runtime.sendMessage({
      action: 'startOffscreenBatchAnalysis',
      urls,
      config: { autoDetect: false, preferOffscreen: true }
    }, (response) => {
      if (response) {
        console.log('✅ Error handling works!');
        console.log('Success:', response.stats?.success);
        console.log('Errors:', response.stats?.errors);
        console.log('Error details:', response.errors);

        if (response.stats.success === 2 && response.stats.errors === 2) {
          console.log('✅ Perfect! 2 success, 2 errors as expected');
        }
      }

      console.groupEnd();
    });
  },

  /**
   * Aide - Liste toutes les commandes
   */
  help() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    🧪 TEST HELPER COMMANDS                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  TestHelper.checkExtensionState()  → Vérifier état extension      ║
║  TestHelper.quickTest()            → Test rapide 3 URLs           ║
║  TestHelper.testAutoDetection()    → Test détection auto          ║
║  TestHelper.testSitemap()          → Test avec sitemap            ║
║  TestHelper.testErrors()           → Test gestion erreurs         ║
║  TestHelper.benchmark()            → Compare Offscreen vs Tabs    ║
║  TestHelper.showLastResults()      → Afficher derniers résultats  ║
║  TestHelper.clearResults()         → Nettoyer le storage          ║
║  TestHelper.help()                 → Afficher cette aide          ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  EXEMPLES:                                                         ║
║                                                                    ║
║  > TestHelper.quickTest()                                          ║
║  > TestHelper.testSitemap('https://example.com/sitemap.xml')      ║
║  > TestHelper.benchmark()                                          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
    `);
  }
};

// Auto-display help
console.log('%c🧪 Test Helper Loaded!', 'font-size: 16px; font-weight: bold; color: #667eea;');
console.log('%cType: TestHelper.help()', 'color: #888;');

// Export global
window.TestHelper = TestHelper;
