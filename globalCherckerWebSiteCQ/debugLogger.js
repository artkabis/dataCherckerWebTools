// debugLogger.js
class DebugLogger {
    constructor() {
        this.logs = {};
        this.currentTab = null;
    }

    // Initialise les logs pour un nouvel onglet
    initTab(tabId, url) {
        this.logs[tabId] = {
            url: url,
            timestamp: new Date().toISOString(),
            messages: [],
            data: {}
        };
        this.currentTab = tabId;
    }

    // Ajoute un log
    log(tabId, message, data = null) {
        if (!this.logs[tabId]) {
            this.initTab(tabId, 'Unknown URL');
        }

        this.logs[tabId].messages.push({
            timestamp: new Date().toISOString(),
            message: message,
            data: data
        });
    }

    // Sauvegarde les données d'analyse
    saveAnalysisData(tabId, data) {
        if (this.logs[tabId]) {
            this.logs[tabId].data = data;
        }
    }

    // Récupère les logs d'un onglet
    getTabLogs(tabId) {
        return this.logs[tabId] || null;
    }

    // Sauvegarde les logs dans le storage local
    async saveLogs() {
        try {
            await chrome.storage.local.set({ debugLogs: this.logs });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des logs:', error);
        }
    }
}

// Créer une instance globale
window.debugLogger = new DebugLogger();

// Modifier la fonction analyzeURL pour utiliser le logger
async function analyzeURL(url) {
    let tab = null;

    try {
        // Création de l'onglet
        tab = await chrome.tabs.create({ url: cleanUrl(url), active: false });
        window.debugLogger.initTab(tab.id, url);
        window.debugLogger.log(tab.id, `Début de l'analyse de la page`);

        // Attente du chargement
        await new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    window.debugLogger.log(tab.id, `Page chargée complètement`);
                    resolve();
                }
            });
        });

        // Injection du script de logging dans l'onglet
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Rediriger les console.log vers notre système
                const originalConsoleLog = console.log;
                console.log = function (...args) {
                    try {
                        chrome.runtime.sendMessage({
                            type: 'PAGE_LOG',
                            data: args.map(arg =>
                                typeof arg === 'object' ? JSON.stringify(arg) : arg
                            ).join(' ')
                        });
                    } catch (e) {
                        // Silently fail if message passing fails
                    }
                    originalConsoleLog.apply(console, args);
                };
            }
        });

        // Injection des autres scripts...
        // [Votre code d'injection existant]

        // Récupération des résultats
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const pageResults = {
                    ...window.dataChecker,
                    url_analyzed: window.location.href,
                    analysis_timestamp: new Date().toISOString()
                };
                return pageResults;
            }
        });

        // Sauvegarde des résultats dans les logs
        window.debugLogger.saveAnalysisData(tab.id, results[0].result);
        window.debugLogger.log(tab.id, `Analyse terminée avec succès`);

        // Sauvegarde des logs avant la fermeture
        await window.debugLogger.saveLogs();

        // Fermeture de l'onglet
        if (tab) {
            await chrome.tabs.remove(tab.id);
        }

        return results[0].result;

    } catch (error) {
        if (tab) {
            window.debugLogger.log(tab.id, `Erreur lors de l'analyse: ${error.message}`);
            await window.debugLogger.saveLogs();
            await chrome.tabs.remove(tab.id);
        }
        throw error;
    }
}

// Ajouter dans results.html
function displayDebugLogs() {
    chrome.storage.local.get(['debugLogs'], function (result) {
        const logs = result.debugLogs;
        if (!logs) return;

        const debugSection = document.createElement('div');
        debugSection.className = 'debug-section';
        debugSection.innerHTML = `
            <h2>Logs de débuggage</h2>
            <div class="debug-logs">
                ${Object.entries(logs).map(([tabId, tabLogs]) => `
                    <div class="tab-log">
                        <h3>Page: ${tabLogs.url}</h3>
                        <div class="messages">
                            ${tabLogs.messages.map(msg => `
                                <div class="log-entry">
                                    <span class="timestamp">${msg.timestamp}</span>
                                    <span class="message">${msg.message}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="data">
                            <h4>Données d'analyse:</h4>
                            <pre>${JSON.stringify(tabLogs.data, null, 2)}</pre>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(debugSection);
    });
}