/**
 * CORS Manager Moderne - ES6 Class
 * Extrait et modernisé depuis service_worker.js
 * @version 2.0
 */

export class CORSManager {
    // Configuration des règles CORS
    static DEFAULT_METHODS = [
        "GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS", "PATCH",
        "PROPFIND", "PROPPATCH", "MKCOL", "COPY", "MOVE", "LOCK",
    ];

    static DEFAULT_STATUS_METHODS = [
        "GET", "POST", "PUT", "OPTIONS", "PATCH", "PROPFIND", "PROPPATCH",
    ];

    // État privé de la classe
    #state = {
        isEnabled: false,
        refCount: 0,
        activeScans: new Set(),
        scanInProgress: false,
        lastActionTimestamp: 0,
        lastRuleCheck: 0,
        enableAttempts: 0
    };

    constructor() {
        this.setupLifecycle();
    }

    /**
     * Obtenir l'état actuel (lecture seule)
     */
    getState() {
        return {
            isEnabled: this.#state.isEnabled,
            refCount: this.#state.refCount,
            activeScans: Array.from(this.#state.activeScans),
            scanInProgress: this.#state.scanInProgress,
            lastActionTimestamp: this.#state.lastActionTimestamp
        };
    }

    /**
     * Vérifier que les règles sont réellement actives
     */
    async verifyRulesActive(expectedRules = ["overwrite-origin"]) {
        try {
            const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
            const allActive = expectedRules.every(rule => enabledRulesets.includes(rule));

            console.log(`[CORS] Rules verification: expected ${expectedRules}, active ${enabledRulesets}, allActive: ${allActive}`);
            return allActive;
        } catch (error) {
            console.error("[CORS] Error verifying rules:", error);
            return false;
        }
    }

    /**
     * Activer CORS avec vérifications robustes
     */
    async enable(scanId = null) {
        this.#updateTimestamp();
        this.#state.refCount++;
        this.#state.enableAttempts++;

        if (scanId) {
            this.#state.activeScans.add(scanId);
        }

        console.log(`[CORS] Enable called. RefCount: ${this.#state.refCount}, Attempt: ${this.#state.enableAttempts}`);

        // Si déjà activé, vérifier les règles
        if (this.#state.isEnabled) {
            const rulesActive = await this.verifyRulesActive();
            if (rulesActive) {
                console.log("[CORS] Already enabled and rules verified active");
                await this.#syncWithBadge();
                return;
            } else {
                console.warn("[CORS] Marked as enabled but rules not active, forcing re-enable");
                this.#state.isEnabled = false;
            }
        }

        await this.#enableRules();
        await this.#syncWithBadge();
    }

    /**
     * Désactiver CORS avec vérifications
     */
    async disable(scanId = null) {
        this.#updateTimestamp();

        if (this.#state.refCount > 0) {
            this.#state.refCount--;
        }

        if (scanId && this.#state.activeScans.has(scanId)) {
            this.#state.activeScans.delete(scanId);
        }

        console.log(`[CORS] Disable called. RefCount: ${this.#state.refCount}, ActiveScans: ${this.#state.activeScans.size}`);

        // Désactiver seulement si toutes les références sont libérées
        if (this.#state.isEnabled && this.#state.refCount === 0 && this.#state.activeScans.size === 0) {
            await this.#disableRules();
            console.log("[CORS] Disabled after all scans complete");

            // Force disable avec délai pour sécurité
            setTimeout(() => this.forceDisable(), 300);
        }

        await this.#syncWithBadge();
    }

    /**
     * Force disable CORS - nettoie tout
     */
    async forceDisable() {
        console.log("[CORS] Force disable initiated");

        const ruleNames = ["overwrite-origin"];

        for (const rule of ruleNames) {
            try {
                await chrome.declarativeNetRequest.updateEnabledRulesets({
                    disableRulesetIds: [rule]
                });
                console.log(`[CORS] Forced disable of rule '${rule}' successful`);
            } catch (error) {
                console.error(`[CORS] Error during forced disable of '${rule}':`, error);
            }
        }

        // Réinitialiser complètement l'état
        this.#resetState();
        await this.#updateStorage(false);
        await this.#updateBadge(false);

        console.log("[CORS] Force disabled - all state reset");
    }

    /**
     * Exécuter une tâche avec gestion sécurisée des CORS
     */
    async runWithSafe(taskFunction, scanId = `scan-${Date.now()}`) {
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                await this.#performHealthCheck();
                await this.enable(scanId);

                console.log(`[CORS] Task ${scanId} started (attempt ${attempt + 1})`);

                const rulesActive = await this.verifyRulesActive();
                if (!rulesActive) {
                    throw new Error("CORS rules not active after enable");
                }

                const result = await taskFunction();
                return result;

            } catch (error) {
                console.error(`[CORS] Error during task ${scanId} (attempt ${attempt + 1}):`, error);

                if (attempt === maxRetries - 1) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                attempt++;

            } finally {
                await this.disable(scanId);
                console.log(`[CORS] Task ${scanId} completed, reference released`);
            }
        }
    }

    /**
     * Diagnostic de santé
     */
    async performHealthCheck() {
        console.group("🏥 [CORS] Health Check");

        try {
            const internalState = this.#state.isEnabled;
            const storageData = await chrome.storage.sync.get(["corsEnabled"]);
            const storageState = storageData.corsEnabled;
            const rulesActive = await this.verifyRulesActive();

            const issues = [];

            if (internalState !== storageState) {
                issues.push("Internal state mismatch with storage");
            }

            if (internalState && !rulesActive) {
                issues.push("CORS enabled but rules not active");
            }

            if (!internalState && rulesActive) {
                issues.push("CORS disabled but rules still active");
            }

            if (this.#state.refCount > 0 && this.#state.activeScans.size === 0) {
                issues.push("Ref count > 0 but no active scans");
            }

            const result = {
                status: issues.length === 0 ? "ok" : "error",
                healthy: issues.length === 0,
                issues,
                message: issues.length === 0
                    ? "No CORS inconsistencies detected"
                    : `${issues.length} CORS issues detected`,
                state: {
                    internal: internalState,
                    storage: storageState,
                    rulesActive,
                    refCount: this.#state.refCount,
                    activeScans: this.#state.activeScans.size,
                    enableAttempts: this.#state.enableAttempts
                }
            };

            console.log("[CORS] Health check result:", result);

            if (!result.healthy) {
                console.log("[CORS] Issues detected, attempting auto-repair...");
                await this.#autoRepair();
            }

            return result;
        } catch (error) {
            console.error("[CORS] Health check failed:", error);
            return { healthy: false, error: error.message };
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Gestionnaire de messages
     */
    handleMessage(request, sender, sendResponse) {
        // Activer/désactiver CORS
        if (request.corsEnabled !== undefined) {
            const action = request.corsEnabled ?
                this.enable(request.scanId) :
                this.disable(request.scanId);

            action.then(() => {
                sendResponse?.({
                    success: true,
                    corsState: this.getState()
                });
            });
            return true;
        }

        // Obtenir l'état des CORS
        if (request.action === 'getCORSStatus') {
            sendResponse(this.getState());
            return true;
        }

        return false;
    }

    /**
     * Configuration du cycle de vie
     */
    setupLifecycle() {
        this.#initState();

        // Suspension de l'extension
        chrome.runtime.onSuspend?.addListener(() => {
            console.log("[CORS] Extension being suspended, forced disable");
            this.forceDisable();
        });

        // Vérification périodique des fuites CORS
        setInterval(() => {
            this.#checkForLeaks();
        }, 30000);
    }

    // === MÉTHODES PRIVÉES ===

    #updateTimestamp() {
        this.#state.lastActionTimestamp = Date.now();
    }

    #resetState() {
        this.#state.isEnabled = false;
        this.#state.refCount = 0;
        this.#state.activeScans.clear();
        this.#state.scanInProgress = false;
    }

    async #enableRules() {
        this.#state.scanInProgress = true;
        const ruleNames = ["overwrite-origin"];
        let allRulesEnabled = true;

        for (const ruleName of ruleNames) {
            const success = await this.#updateRule(ruleName, true);
            if (!success) {
                allRulesEnabled = false;
                console.error(`[CORS] Failed to enable rule: ${ruleName}`);
            }
        }

        // Tentative supplémentaire si échec
        if (!allRulesEnabled) {
            console.error("[CORS] Some rules failed, retrying...");
            await new Promise(resolve => setTimeout(resolve, 500));

            for (const ruleName of ruleNames) {
                await this.#updateRule(ruleName, true);
            }
        }

        // Vérifications multiples
        const rulesVerified = await this.#verifyWithRetries();

        if (rulesVerified) {
            await this.#updateStorage(true);
            this.#state.isEnabled = true;
            this.#state.lastRuleCheck = Date.now();
            console.log(`[CORS] Successfully enabled after verification`);
        } else {
            console.error("[CORS] Failed to verify rules after maximum attempts");
            this.#state.isEnabled = true; // Marquer comme activé partiellement
            await this.#updateStorage(true);
        }
    }

    async #disableRules() {
        await this.#updateStorage(false);
        this.#state.isEnabled = false;
        this.#state.scanInProgress = false;

        const ruleNames = ["overwrite-origin"];
        for (const ruleName of ruleNames) {
            await this.#updateRule(ruleName, false);
            console.log(`[CORS] Rule ${ruleName} disabled`);
        }
    }

    async #updateRule(rule, enable) {
        console.log(`[CORS] Updating rule '${rule}' to ${enable ? 'enabled' : 'disabled'}`);

        try {
            const operation = enable
                ? { enableRulesetIds: [rule] }
                : { disableRulesetIds: [rule] };

            await chrome.declarativeNetRequest.updateEnabledRulesets(operation);

            // Vérification immédiate
            const enabledRules = await chrome.declarativeNetRequest.getEnabledRulesets();
            const isActive = enabledRules.includes(rule);

            if (enable && !isActive) {
                console.error(`[CORS] Rule '${rule}' should be enabled but is not active`);
                return false;
            }

            if (!enable && isActive) {
                console.error(`[CORS] Rule '${rule}' should be disabled but is still active`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`[CORS] Error updating rule '${rule}':`, error);
            return false;
        }
    }

    async #verifyWithRetries(maxAttempts = 5) {
        let attempt = 0;
        let rulesVerified = false;

        while (attempt < maxAttempts && !rulesVerified) {
            await new Promise(resolve => setTimeout(resolve, 200 + (attempt * 100)));
            rulesVerified = await this.verifyRulesActive();

            if (!rulesVerified) {
                console.warn(`[CORS] Rules verification failed, attempt ${attempt + 1}/${maxAttempts}`);
                // Réessayer d'activer
                for (const ruleName of ["overwrite-origin"]) {
                    await this.#updateRule(ruleName, true);
                }
            }

            attempt++;
        }

        return rulesVerified;
    }

    async #initState() {
        const result = await chrome.storage.sync.get("corsEnabled");
        const shouldBeEnabled = false; // Par défaut désactivé au démarrage

        if (result.corsEnabled !== shouldBeEnabled) {
            await chrome.storage.sync.set({ corsEnabled: shouldBeEnabled });
        }

        this.#resetState();
        this.#state.isEnabled = shouldBeEnabled;

        // Désactiver toutes les règles au démarrage
        const ruleNames = ["overwrite-origin"];
        for (const ruleName of ruleNames) {
            await this.#updateRule(ruleName, shouldBeEnabled);
        }

        await this.#updateBadge(shouldBeEnabled);
        console.log("[CORS] State initialized:", shouldBeEnabled);
    }

    #checkForLeaks() {
        if (this.#state.isEnabled && this.#state.refCount === 0 && this.#state.activeScans.size === 0) {
            const idleTime = Date.now() - this.#state.lastActionTimestamp;

            if (idleTime > 60000) {
                console.warn(`[CORS] Enabled without active scans for ${idleTime}ms, forcing disable`);
                this.forceDisable();
            }
        }
    }

    async #autoRepair() {
        console.log("🔧 [CORS] Starting auto-repair...");

        try {
            await this.forceDisable();
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.#resetState();
            await this.#updateStorage(false);

            const rulesStillActive = await this.verifyRulesActive();
            if (rulesStillActive) {
                console.warn("[CORS] Rules still active after repair");
            }

            console.log("[CORS] Auto-repair completed");
            return true;
        } catch (error) {
            console.error("[CORS] Auto-repair failed:", error);
            return false;
        }
    }

    async #updateStorage(enabled) {
        await chrome.storage.sync.set({ corsEnabled: enabled });
    }

    async #updateBadge(enabled) {
        if (enabled) {
            chrome.action.setBadgeText({ text: 'CORS' });
            chrome.action.setBadgeBackgroundColor({ color: '#CC0000' });
            chrome.action.setBadgeTextColor({ color: 'white' });
            chrome.action.setTitle({ title: 'Website Health Checker - CORS Activé' });
        } else {
            chrome.action.setBadgeText({ text: '' });
            chrome.action.setTitle({ title: 'Website Health Checker' });
        }
    }

    async #syncWithBadge() {
        await this.#updateBadge(this.#state.isEnabled);
    }

    async #performHealthCheck() {
        return this.performHealthCheck();
    }
}