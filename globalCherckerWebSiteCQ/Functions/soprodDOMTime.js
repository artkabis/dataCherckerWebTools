/**
 * Ce script est une version nettoyée, corrigée et améliorée
 * du bookmarklet fourni. Il a pour but de :
 * 1. Trouver un champ de saisie de code postal sur la page.
 * 2. Détecter si le code postal correspond à un DOM-TOM.
 * 3. Afficher l'heure locale du DOM-TOM correspondant dans un encadré UNIQUEMENT si différente.
 * 
 * VERSION AVEC MUTATIONOBSERVER - Attend que les éléments soient disponibles
 */

// Utilisation d'une fonction anonyme auto-invoquée (IIFE)
// pour ne pas polluer l'environnement global de la page.
console.log("🔥 SCRIPT SOPROD DOMTIME CHARGÉ !");

(() => {

    // Objet de configuration contenant les préfixes des codes postaux
    // des DOM-TOM et leur décalage horaire par rapport à UTC.
    const timeZoneOffsets = {
        '971': { offset: -4, country: "Guadeloupe" },
        '972': { offset: -4, country: "Martinique" },
        '973': { offset: -3, country: "Guyane" },
        '974': { offset: 4, country: "La Réunion" },
        '975': { offset: -2, country: "Saint-Pierre-et-Miquelon" },
        '976': { offset: 3, country: "Mayotte" },
        // TAAF
        '984': { offset: 5, country: "Terres Australes et Antarctiques" },
        '986': { offset: 12, country: "Wallis-et-Futuna" },
        '987': { offset: -10, country: "Polynésie française" },
        '988': { offset: 11, country: "Nouvelle-Calédonie" }
    };

    // Variables pour gérer l'état du script
    let isInitialized = false;
    let mutationObserver = null;
    let eventListenersAdded = new Set(); // Pour éviter les doublons d'event listeners

    /**
     * Formate un objet Date en une chaîne de caractères "HH:MM:SS".
     * @param {Date} date L'objet Date à formater.
     * @returns {string} L'heure formatée.
     */
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Calcule l'heure dans un fuseau horaire donné par son décalage UTC.
     * @param {number} offsetHours Le décalage par rapport à UTC (ex: -4).
     * @returns {string} L'heure calculée et formatée.
     */
    function getAdjustedTime(offsetHours) {
        const now = new Date();
        // Calcule le temps UTC en millisecondes
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        // Applique le décalage de la destination
        const targetTime = new Date(utcTime + (offsetHours * 60 * 60 * 1000));
        return formatTime(targetTime);
    }

    /**
     * Affiche une boîte en bas à gauche de l'écran avec les informations horaires.
     * @param {string} currentTime L'heure locale de l'utilisateur.
     * @param {string|null} adjustedTime L'heure calculée pour le DOM-TOM.
     * @param {string|null} country Le nom du DOM-TOM.
     */
    function injectTimeDiv(currentTime, adjustedTime = null, country = null) {
        // Cherche si la div existe déjà
        let timeDiv = document.getElementById('domTomTimeDiv');

        // Si elle n'existe pas, on la crée et la stylise
        if (!timeDiv) {
            timeDiv = document.createElement('div');
            timeDiv.id = 'domTomTimeDiv';
            timeDiv.style.position = 'fixed';
            timeDiv.style.bottom = '10px';
            timeDiv.style.left = '10px';
            timeDiv.style.padding = '15px';
            timeDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            timeDiv.style.color = 'white';
            timeDiv.style.fontSize = '14px';
            timeDiv.style.fontFamily = 'Arial, sans-serif';
            timeDiv.style.zIndex = '9999';
            timeDiv.style.borderRadius = '8px';
            timeDiv.style.border = '1px solid #444';
            document.body.appendChild(timeDiv);
        }

        // Construit le contenu HTML à afficher
        let content = `Votre heure :<br><span style="color: #4dabf7; font-size: 2em; font-weight: bold;">${currentTime}</span>`;
        if (adjustedTime && country) {
            content += `<br><br>Heure : ${country} :<br><span style="color: #ff8787; font-size: 2em; font-weight: bold;">${adjustedTime}</span>`;
        }

        timeDiv.innerHTML = content;
    }

    /**
     * Supprime la div d'affichage si elle existe.
     */
    function removeTimeDiv() {
        const timeDiv = document.getElementById('domTomTimeDiv');
        if (timeDiv) {
            timeDiv.remove();
        }
    }

    /**
     * Calcule le décalage horaire actuel de l'utilisateur en heures par rapport à UTC.
     * @returns {number} Le décalage en heures (ex: -1 pour UTC+1 en heure d'hiver).
     */
    function getUserTimezoneOffset() {
        return -new Date().getTimezoneOffset() / 60;
    }

    /**
     * Fonction principale qui recherche le champ de code postal et met à jour l'heure.
     */
    function checkAndUpdateTime() {
        // Sélectionne tous les éléments qui ressemblent à un groupe de formulaire
        document.querySelectorAll('.input-group').forEach(item => {
            // Cherche un label ou un addon qui contient "CodePostal"
            const label = item.querySelector('.input-group-addon');
            if (label && label.innerText.includes('CodePostal')) {

                const inputCP = item.querySelector('input');
                if (!inputCP) return;

                const cpValue = inputCP.value;
                let targetOffset = null;
                let countryName = null;

                // Cherche si le code postal correspond à un préfixe de DOM-TOM
                for (const prefix in timeZoneOffsets) {
                    if (cpValue.startsWith(prefix)) {
                        targetOffset = timeZoneOffsets[prefix].offset;
                        countryName = timeZoneOffsets[prefix].country;
                        break;
                    }
                }

                // CONDITION PRINCIPALE : n'afficher que si il y a un décalage différent
                if (targetOffset !== null) {
                    const userOffset = getUserTimezoneOffset();

                    // Si le décalage du DOM-TOM est différent de celui de l'utilisateur
                    if (targetOffset !== userOffset) {
                        const userCurrentTime = formatTime(new Date());
                        const adjustedTime = getAdjustedTime(targetOffset);
                        injectTimeDiv(userCurrentTime, adjustedTime, countryName);
                    } else {
                        // Même fuseau horaire : on supprime l'affichage
                        removeTimeDiv();
                    }
                } else {
                    // Aucun DOM-TOM détecté : on supprime l'affichage
                    removeTimeDiv();
                }
            }
        });
    }

    /**
     * Vérifie si les éléments requis sont présents dans le DOM
     * @returns {boolean} True si les éléments sont trouvés
     */
    function areRequiredElementsPresent() {
        const inputGroups = document.querySelectorAll('.input-group');

        // Cherche au moins un groupe avec un label "CodePostal"
        for (const item of inputGroups) {
            const label = item.querySelector('.input-group-addon');
            if (label && label.innerText.includes('CodePostal')) {
                const inputCP = item.querySelector('input');
                if (inputCP) {
                    console.log('✅ Éléments DOM trouvés pour soprodDOMTime');
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Ajoute les event listeners sur les champs de code postal
     */
    function addEventListeners() {
        document.querySelectorAll('.input-group').forEach(item => {
            const label = item.querySelector('.input-group-addon');
            if (label && label.innerText.includes('CodePostal')) {
                const inputCP = item.querySelector('input');
                if (inputCP && !eventListenersAdded.has(inputCP)) {
                    // Ajoute un écouteur d'événement qui se déclenche quand l'utilisateur tape
                    inputCP.addEventListener('input', checkAndUpdateTime);
                    eventListenersAdded.add(inputCP);
                    console.log('📋 Event listener ajouté sur champ CodePostal');
                }
            }
        });
    }

    /**
     * Initialise le script principal
     */
    function initializeScript() {
        if (isInitialized) return;

        console.log('🚀 Initialisation du script soprodDOMTime');

        // Exécute la fonction une première fois
        checkAndUpdateTime();

        // Ajoute les event listeners
        addEventListeners();

        // Marque comme initialisé
        isInitialized = true;

        // Arrête l'observer maintenant que tout est initialisé
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
            console.log('🔍 MutationObserver arrêté - script initialisé avec succès');
        }
    }

    /**
     * Démarre l'observation des mutations DOM
     */
    function startObserving() {
        // Vérifie d'abord si les éléments sont déjà présents
        if (areRequiredElementsPresent()) {
            initializeScript();
            return;
        }

        console.log('⏳ Éléments DOM non trouvés, démarrage du MutationObserver...');

        // Crée le MutationObserver
        mutationObserver = new MutationObserver((mutations) => {
            // Vérifie s'il y a eu des ajouts d'éléments
            let shouldCheck = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Vérifie si des éléments HTML ont été ajoutés
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }

                // Vérifie aussi les changements d'attributs qui pourraient indiquer
                // que le contenu est maintenant disponible
                if (mutation.type === 'attributes') {
                    shouldCheck = true;
                }
            });

            // Si des changements pertinents ont été détectés, vérifie les éléments
            if (shouldCheck && areRequiredElementsPresent()) {
                initializeScript();
            }
        });

        // Commence l'observation
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'] // Observer les changements de classe et style
        });

        // Timeout de sécurité : arrête l'observation après 30 secondes
        setTimeout(() => {
            if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObserver = null;
                console.log('⚠️ Timeout : MutationObserver arrêté après 30 secondes');

                // Tentative de dernière chance
                if (areRequiredElementsPresent()) {
                    initializeScript();
                } else {
                    console.log('⚠️ Éléments requis toujours non trouvés après timeout');
                }
            }
        }, 30000);
    }

    /**
     * Point d'entrée principal
     */
    function main() {
        console.log('main dom tom start !!!');
        // Si le document est déjà complètement chargé
        if (document.readyState === 'complete') {
            console.log('soprod dom tom loaded !!!');
            startObserving();
        } else {
            // Sinon, attendre que le document soit prêt
            document.addEventListener('DOMContentLoaded', startObserving);

            // Fallback au cas où DOMContentLoaded ne se déclenche pas
            if (document.readyState === 'loading') {
                document.addEventListener('readystatechange', () => {
                    if (document.readyState === 'interactive' || document.readyState === 'complete') {
                        startObserving();
                    }
                });
            }
        }
    }

    // Démarre le script
    main();

})();