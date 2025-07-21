/**
 * Ce script est une version nettoyée, corrigée et améliorée
 * du bookmarklet fourni. Il a pour but de :
 * 1. Trouver un champ de saisie de code postal sur la page.
 * 2. Détecter si le code postal correspond à un DOM-TOM.
 * 3. Afficher l'heure locale du DOM-TOM correspondant dans un encadré.
 */

// Utilisation d'une fonction anonyme auto-invoquée (IIFE)
// pour ne pas polluer l'environnement global de la page.
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
     * 
     * NOTE : Cette fonction a été corrigée. La version originale du bookmarklet
     * contenait une logique de calcul de l'heure d'été (DST) qui n'était pas fiable.
     * Cette nouvelle version utilise la méthode standard et précise :
     * 1. On récupère l'heure locale de l'utilisateur.
     * 2. On la convertit en heure UTC.
     * 3. On applique le décalage horaire de la destination à l'heure UTC.
     * 
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
            content += `<br><br>Heure à ${country} :<br><span style="color: #ff8787; font-size: 2em; font-weight: bold;">${adjustedTime}</span>`;
        }

        timeDiv.innerHTML = content;
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

                const userCurrentTime = formatTime(new Date());

                if (targetOffset !== null) {
                    const adjustedTime = getAdjustedTime(targetOffset);
                    injectTimeDiv(userCurrentTime, adjustedTime, countryName);
                } else {
                    // Si aucun DOM-TOM ne correspond, on affiche juste l'heure locale
                    injectTimeDiv(userCurrentTime);
                }
            }
        });
    }

    // Exécute la fonction une première fois au lancement du bookmarklet
    checkAndUpdateTime();

    // Pour une meilleure expérience, on peut aussi écouter les changements
    // sur le champ de code postal pour une mise à jour dynamique.
    document.querySelectorAll('.input-group').forEach(item => {
        const label = item.querySelector('.input-group-addon');
        if (label && label.innerText.includes('CodePostal')) {
            const inputCP = item.querySelector('input');
            if (inputCP) {
                // Ajoute un écouteur d'événement qui se déclenche quand l'utilisateur tape
                inputCP.addEventListener('input', checkAndUpdateTime);
            }
        }
    });

})();