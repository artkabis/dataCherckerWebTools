// analysisOrchestrator.js - Coordonne les différentes analyses
(($) => {
    // État global de l'orchestrateur
    window.analysisState = {
        linksCompleted: false,
        imagesCompleted: false,
        allCompleted: false,
        startTime: null,
        endTime: null,
        duration: 0,
        lastProgressUpdate: Date.now()
    };

    // Configuration de l'orchestrateur
    const orchestratorConfig = {
        progressUpdateInterval: 500, // Intervalle pour les mises à jour de progression (ms)
        timeout: 120000,           // Timeout global (ms)
        timeoutCheckInterval: 2000  // Intervalle de vérification du timeout (ms)
    };

    // Fonction pour vérifier si toutes les analyses sont terminées
    window.checkAllAnalysesComplete = function () {
        const linksCompleted = window.isLinksAnalysisComplete ? window.isLinksAnalysisComplete() : false;
        const imagesCompleted = window.isImagesAnalysisComplete ? window.isImagesAnalysisComplete() : false;

        window.analysisState.linksCompleted = linksCompleted;
        window.analysisState.imagesCompleted = imagesCompleted;

        if (linksCompleted && imagesCompleted && !window.analysisState.allCompleted) {
            window.analysisState.allCompleted = true;
            window.analysisState.endTime = Date.now();
            window.analysisState.duration = window.analysisState.endTime - window.analysisState.startTime;

            console.log(`🎉 Toutes les analyses sont terminées en ${window.analysisState.duration / 1000} secondes !`);

            // Mettre à jour les données globales si nécessaire
            updateGlobalData();

            // Signaler que toutes les analyses sont terminées
            window.dataCheckerAnalysisComplete = true;
            window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete', {
                detail: {
                    duration: window.analysisState.duration,
                    linksResults: window.getLinksAnalysisResults ? window.getLinksAnalysisResults() : null,
                    imagesResults: window.getImagesAnalysisResults ? window.getImagesAnalysisResults() : null
                }
            }));

            // Arrêter le timer de surveillance du timeout
            if (window.analysisTimeoutTimer) {
                clearInterval(window.analysisTimeoutTimer);
                window.analysisTimeoutTimer = null;
            }
        }
    };

    // Fonction pour mettre à jour les données globales après toutes les analyses
    function updateGlobalData() {
        // Si nécessaire, combiner les résultats des différentes analyses
        // Cette fonction peut être étendue selon vos besoins
        console.log("Mise à jour des données globales");
    }

    // Fonction pour surveiller la progression des analyses
    function monitorProgress() {
        const now = Date.now();

        // Ne mettre à jour que si suffisamment de temps s'est écoulé depuis la dernière mise à jour
        if (now - window.analysisState.lastProgressUpdate >= orchestratorConfig.progressUpdateInterval) {
            window.analysisState.lastProgressUpdate = now;

            const linksProgress = window.linksAnalysisState ? {
                total: window.linksAnalysisState.totalLinks,
                processed: window.linksAnalysisState.processedLinks,
                percentage: window.linksAnalysisState.totalLinks > 0
                    ? Math.round((window.linksAnalysisState.processedLinks / window.linksAnalysisState.totalLinks) * 100)
                    : 0
            } : { total: 0, processed: 0, percentage: 0 };

            const imagesProgress = window.imagesAnalysisState ? {
                total: window.imagesAnalysisState.totalImages,
                processed: window.imagesAnalysisState.processedImages,
                percentage: window.imagesAnalysisState.totalImages > 0
                    ? Math.round((window.imagesAnalysisState.processedImages / window.imagesAnalysisState.totalImages) * 100)
                    : 0
            } : { total: 0, processed: 0, percentage: 0 };

            const overallPercentage = Math.round((linksProgress.percentage + imagesProgress.percentage) / 2);

            console.log(`Progression: ${overallPercentage}% (Liens: ${linksProgress.percentage}%, Images: ${imagesProgress.percentage}%)`);

            // Déclencher un événement de progression pour d'éventuels écouteurs externes
            window.dispatchEvent(new CustomEvent('analysisProgress', {
                detail: {
                    overall: overallPercentage,
                    links: linksProgress,
                    images: imagesProgress,
                    elapsed: Date.now() - window.analysisState.startTime
                }
            }));
        }

        // Vérifier si les analyses sont terminées
        checkAllAnalysesComplete();

        // Continuer la surveillance si les analyses sont toujours en cours
        if (!window.analysisState.allCompleted) {
            requestAnimationFrame(monitorProgress);
        }
    }

    // Fonction pour gérer les timeouts
    function setupTimeoutMonitoring() {
        const startTime = window.analysisState.startTime;

        window.analysisTimeoutTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;

            // Vérifier si le timeout global est dépassé
            if (elapsed > orchestratorConfig.timeout) {
                console.warn(`⚠️ Timeout global dépassé (${orchestratorConfig.timeout / 1000}s)`);

                // Forcer la fin de l'analyse
                window.analysisState.linksCompleted = true;
                window.analysisState.imagesCompleted = true;
                window.analysisState.allCompleted = true;

                // Signaler le timeout
                window.dataCheckerAnalysisComplete = true;
                window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete', {
                    detail: {
                        timeout: true,
                        duration: elapsed,
                        message: "L'analyse a été interrompue en raison d'un délai d'attente dépassé"
                    }
                }));

                // Arrêter le timer
                clearInterval(window.analysisTimeoutTimer);
                window.analysisTimeoutTimer = null;
            }
        }, orchestratorConfig.timeoutCheckInterval);
    }

    // Fonction principale pour démarrer toutes les analyses
    window.startAllAnalyses = function (options = {}) {
        // Fusionner les options avec la configuration par défaut
        const config = { ...orchestratorConfig, ...options };

        // Réinitialiser l'état
        window.analysisState = {
            linksCompleted: false,
            imagesCompleted: false,
            allCompleted: false,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            lastProgressUpdate: Date.now()
        };
        window.dataCheckerAnalysisComplete = false;

        console.log("🚀 Démarrage de toutes les analyses...");

        // Écouter les événements de fin d'analyse
        window.addEventListener('linksAnalysisComplete', (event) => {
            console.log("✅ Analyse des liens terminée");
            window.analysisState.linksCompleted = true;
            checkAllAnalysesComplete();
        }, { once: true });

        window.addEventListener('imagesAnalysisComplete', (event) => {
            console.log("✅ Analyse des images terminée");
            window.analysisState.imagesCompleted = true;
            checkAllAnalysesComplete();
        }, { once: true });

        // Configurer la surveillance du timeout
        setupTimeoutMonitoring();

        // Démarrer la surveillance de la progression
        requestAnimationFrame(monitorProgress);

        // Démarrer les analyses en parallèle
        if (window.startLinksAnalysis) {
            console.log("🔗 Démarrage de l'analyse des liens");
            window.startLinksAnalysis();
        } else {
            console.warn("⚠️ Module d'analyse des liens non disponible");
            window.analysisState.linksCompleted = true;
        }

        if (window.startImagesAnalysis) {
            console.log("🖼️ Démarrage de l'analyse des images");
            window.startImagesAnalysis();
        } else {
            console.warn("⚠️ Module d'analyse des images non disponible");
            window.analysisState.imagesCompleted = true;
        }

        // Vérifier immédiatement si tous les modules sont indisponibles
        checkAllAnalysesComplete();

        return {
            isRunning: () => !window.analysisState.allCompleted,
            getProgress: () => ({
                links: window.linksAnalysisState ? {
                    total: window.linksAnalysisState.totalLinks,
                    processed: window.linksAnalysisState.processedLinks
                } : null,
                images: window.imagesAnalysisState ? {
                    total: window.imagesAnalysisState.totalImages,
                    processed: window.imagesAnalysisState.processedImages
                } : null,
                overall: window.analysisState
            }),
            cancel: () => {
                // Forcer l'arrêt de l'analyse
                window.analysisState.allCompleted = true;
                window.dataCheckerAnalysisComplete = true;

                // Nettoyer les timers
                if (window.analysisTimeoutTimer) {
                    clearInterval(window.analysisTimeoutTimer);
                    window.analysisTimeoutTimer = null;
                }

                window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete', {
                    detail: { cancelled: true }
                }));
            }
        };
    };

    // Vérifier si le wrapper de compatibilité est nécessaire
    if (!window.dataCheckerAnalysisComplete) {
        window.dataCheckerAnalysisComplete = false;
    }

})(jQuery);