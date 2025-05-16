/**
 * Script complet de détection des liens coupés dans les conteneurs dmNewParagraph
 * Version révisée avec débogage - Mai 2024
 */

(function () {
    /**
     * Détecte les liens qui pourraient être "coupés".
     * @returns {Array} - Liste des problèmes détectés
     */
    function verifierLiensCoupes() {
        console.log("%cDébut de la vérification des liens coupés...", "color:blue; font-weight:bold");
        const problemes = [];
        const liensTraites = new Set();

        document.querySelectorAll('div.dmNewParagraph').forEach((conteneur) => {
            const liensConteneur = conteneur.querySelectorAll('a');
            if (liensConteneur.length === 0) return;

            const texteCompletPourRapport = conteneur.textContent.substring(0, 200) + (conteneur.textContent.length > 200 ? '...' : '');

            liensConteneur.forEach((lien, lienIndex) => { // Ajout de lienIndex pour logs
                if (liensTraites.has(lien)) return;
                liensTraites.add(lien);

                const texteLien = lien.textContent.trim();
                if (!texteLien || lien.querySelector('img')) return;

                console.log(`%cVérification du lien #${lienIndex}: "${texteLien.substring(0, 30)}..."`, "color:darkcyan");
                console.log("  Lien element:", lien);

                let textePrecedentImmediat = "";
                let noeudPrecedentInitial = lien.previousSibling;

                // DEBUG: Log du noeud précédent initial
                console.log("  Noeud frère précédent initial:", noeudPrecedentInitial);
                if (noeudPrecedentInitial) {
                    console.log(`    Type: ${noeudPrecedentInitial.nodeType}, Contenu brut: "${noeudPrecedentInitial.textContent}"`);
                }

                // Optionnel: Boucle pour sauter les nœuds texte vides/blancs (peut être activée si besoin)
                // Cette boucle pourrait changer la détection si des retours à la ligne sont entre les éléments.
                /*
                let noeudPrecedentPourLogique = noeudPrecedentInitial;
                while (noeudPrecedentPourLogique &&
                       noeudPrecedentPourLogique.nodeType === Node.TEXT_NODE &&
                       noeudPrecedentPourLogique.textContent.trim() === "") {
                    console.log("    Sauté noeud texte vide/blanc:", noeudPrecedentPourLogique);
                    noeudPrecedentPourLogique = noeudPrecedentPourLogique.previousSibling;
                }
                console.log("  Noeud frère précédent après saut des vides (si activé):", noeudPrecedentPourLogique);
                if (noeudPrecedentPourLogique && noeudPrecedentPourLogique !== noeudPrecedentInitial) {
                     console.log(`    Type: ${noeudPrecedentPourLogique.nodeType}, Contenu brut: "${noeudPrecedentPourLogique.textContent}"`);
                }
                let noeudPrecedent = noeudPrecedentPourLogique; // Utiliser ce noeud pour la suite
                */
                let noeudPrecedent = noeudPrecedentInitial; // Par défaut, ne pas sauter les noeuds vides


                if (noeudPrecedent) {
                    if (noeudPrecedent.nodeType === Node.TEXT_NODE) {
                        textePrecedentImmediat = noeudPrecedent.textContent;
                    } else if (noeudPrecedent.nodeType === Node.ELEMENT_NODE) {
                        textePrecedentImmediat = noeudPrecedent.textContent;
                        // DEBUG: Si c'est un élément, vérifier son dernier enfant texte
                        let dernierEnfantTexteInterne = "";
                        let curseur = noeudPrecedent.lastChild;
                        while (curseur) {
                            if (curseur.nodeType === Node.TEXT_NODE) {
                                dernierEnfantTexteInterne = curseur.textContent;
                                break;
                            }
                            if (curseur.nodeType === Node.ELEMENT_NODE && curseur.lastChild) {
                                curseur = curseur.lastChild; // Plonger
                            } else {
                                curseur = curseur.previousSibling; // Remonter ou passer au frère
                            }
                        }
                        console.log(`    [Element] Contenu textuel total: "${textePrecedentImmediat}"`);
                        console.log(`    [Element] Dernier nœud texte interne (approximatif): "${dernierEnfantTexteInterne}"`);
                    }
                }
                console.log(`  Texte précédent immédiat déterminé: "${textePrecedentImmediat}" (longueur: ${textePrecedentImmediat.length})`);


                let contexteAvantPourRapport = "N/A";
                const posLienDansConteneurText = conteneur.textContent.indexOf(texteLien);
                if (posLienDansConteneurText > 0) {
                    const debutPosRapport = Math.max(0, posLienDansConteneurText - 20);
                    contexteAvantPourRapport = conteneur.textContent.substring(debutPosRapport, posLienDansConteneurText);
                } else {
                    contexteAvantPourRapport = textePrecedentImmediat.slice(-20);
                }

                const dernierCaractereAvant = textePrecedentImmediat.slice(-1);
                // Regex pour vérifier si le dernier caractère N'EST PAS un espace blanc.
                const pasDEspaceAvant = textePrecedentImmediat.length > 0 && !/\s$/.test(textePrecedentImmediat);

                console.log(`  Dernier caractère avant: "${dernierCaractereAvant}" (code: ${dernierCaractereAvant.charCodeAt(0)})`);
                console.log(`  Pas d'espace avant (basé sur textePrecedentImmediat qui se termine par non-\\s): ${pasDEspaceAvant}`);

                const estCaracterePotentiellementCoupe = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ0-9]/.test(dernierCaractereAvant);
                const premierCaractereLien = texteLien.charAt(0);
                const premierLienEstAlphanum = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ0-9]/.test(premierCaractereLien);

                console.log(`  Est caractère potentiellement coupé (dernierCaractereAvant est alphanum): ${estCaracterePotentiellementCoupe}`);
                console.log(`  Premier caractère du lien est alphanum (pour "${premierCaractereLien}"): ${premierLienEstAlphanum}`);

                const ponctuationPermise = ['"', "'", '(', '[', '{', '«', '.', ':', ';', ',', '/', '\\'];
                const prefixesIgnores = new Set(['m', 'km', 'cm', 'mm', 'kg', 'g', 'l', 'ml', 'h', 'min', 'sec', 'no', 'n°']);

                if (pasDEspaceAvant && estCaracterePotentiellementCoupe && premierLienEstAlphanum) {
                    console.log("    Cond 1 (structure de base pour un problème): VRAIE");
                    if (!ponctuationPermise.includes(dernierCaractereAvant)) {
                        console.log(`    Cond 2 (pas une ponctuation permise "${dernierCaractereAvant}"): VRAIE`);
                        const motsAvant = textePrecedentImmediat.trimRight().split(/\s+/);
                        const dernierMotAvant = motsAvant.length > 0 ? motsAvant[motsAvant.length - 1] : '';
                        console.log(`    Dernier mot avant (de textePrecedentImmediat): "${dernierMotAvant}"`);

                        // Logique pour déterminer si le caractère/mot précédent est un préfixe à ignorer
                        // Un problème est signalé si ce n'est PAS un préfixe ignoré.
                        // On ignore si le `dernierMotAvant` est dans la liste des préfixes ET
                        // (soit ce mot a plus d'une lettre (ex: "km"),
                        //  soit il a une lettre et cette lettre est bien le `dernierCaractereAvant` (ex: "m"))
                        let ignorerCausePrefixe = false;
                        if (prefixesIgnores.has(dernierMotAvant.toLowerCase())) {
                            if (dernierMotAvant.length > 1) {
                                ignorerCausePrefixe = true; // Ex: "km"
                            } else if (dernierMotAvant.length === 1 && dernierCaractereAvant.toLowerCase() === dernierMotAvant.toLowerCase()) {
                                ignorerCausePrefixe = true; // Ex: "m"
                            }
                        }

                        console.log(`    Ignorer à cause d'un préfixe (comme "m", "km"): ${ignorerCausePrefixe}`);
                        if (!ignorerCausePrefixe) {
                            console.log("      %cPROBLÈME DÉTECTÉ !", "color:red; font-weight:bold;");
                            problemes.push({
                                lien: lien,
                                type: "lien_probablement_coupe",
                                texte: texteLien,
                                html: lien.outerHTML,
                                contexteAvant: contexteAvantPourRapport,
                                textePrecedentDirect: textePrecedentImmediat,
                                caractereManquant: dernierCaractereAvant,
                                premierMotLien: texteLien.split(/\s+/)[0],
                                texteCompletSuggere: dernierCaractereAvant + texteLien,
                                idConteneur: conteneur.id || '',
                                classesConteneur: conteneur.className,
                                texteCompletConteneurPourRapport: texteCompletPourRapport,
                                cheminConteneur: obtenirCheminHTML(conteneur),
                                indexDansConteneur: Array.from(conteneur.querySelectorAll('a')).indexOf(lien)
                            });
                        }
                    } else {
                        console.log(`    Cond 2 (pas une ponctuation permise "${dernierCaractereAvant}"): FAUSSE (c'est une ponctuation)`);
                    }
                } else {
                    console.log("    Cond 1 (structure de base pour un problème): FAUSSE. Raisons possibles:");
                    if (!pasDEspaceAvant) console.log("      - Soit textePrecedentImmediat est vide, soit il se termine par \\s.");
                    if (!estCaracterePotentiellementCoupe) console.log("      - Soit dernierCaractereAvant n'est pas alphanumérique.");
                    if (!premierLienEstAlphanum) console.log("      - Soit premierCaractereLien n'est pas alphanumérique.");
                }
                console.log("------------------------------------");
            });
        });

        // ... (affichage des résultats identique)
        if (problemes.length > 0) {
            console.log(`%c${problemes.length} problèmes de liens coupés détectés`, 'color:red; font-weight:bold; font-size: 14px; background: #f5f5f5; padding: 5px;');
            console.table(problemes.map(p => ({
                "Texte du lien": p.texte,
                "Contexte avant (large)": p.contexteAvant,
                "Texte précédent direct": `"${p.textePrecedentDirect}"`,
                "Caractère manquant": p.caractereManquant,
                "Texte suggéré": p.texteCompletSuggere
            })));
            problemes.forEach((p, index) => {
                console.group(`%cDétail Problème #${index + 1}`, 'color:red; font-weight:bold');
                console.log(`ID Conteneur: ${p.idConteneur}`);
                console.log(`Classes Conteneur: ${p.classesConteneur}`);
                console.log(`Texte avant (large): "${p.contexteAvant}"`);
                console.log(`Texte précédent direct: "${p.textePrecedentDirect}"`);
                console.log(`Texte du lien: "${p.texte}"`);
                console.log(`Correction suggérée: "${p.texteCompletSuggere}"`);
                console.log('Élément:', p.lien);
                console.log('HTML:', p.html);
                console.groupEnd();
            });
        } else {
            console.log('%cAucun problème de lien coupé détecté', 'color:green; font-weight:bold; font-size: 14px; background: #f5f5f5; padding: 5px;');
        }
        return problemes;
    }


    /**
     * Met en évidence visuellement les liens coupés sur la page.
     * @param {Array} problemes - Liste des problèmes DÉJÀ DÉTECTÉS
     */
    function mettreEnEvidenceLiensCoupes(problemes) {
        document.querySelectorAll('.lien-coupe-highlight-custom').forEach(el => {
            const infoDiv = el.querySelector('.lien-coupe-info-custom');
            if (infoDiv) infoDiv.remove();
            el.classList.remove('lien-coupe-highlight-custom');
            if (el.dataset.originalPosition) {
                el.style.position = el.dataset.originalPosition;
            } else {
                el.style.removeProperty('position');
            }
            delete el.dataset.originalPosition;
        });

        if (!problemes || problemes.length === 0) {
            console.log('%cAucun problème à mettre en évidence', 'color:green; font-weight:bold');
            const panneauExistant = document.getElementById('panneau-resume-liens-custom');
            if (panneauExistant) panneauExistant.remove();
            return;
        }

        if (!document.getElementById('style-liens-coupes-custom')) {
            const style = document.createElement('style');
            style.id = 'style-liens-coupes-custom';
            style.textContent = `
        .lien-coupe-highlight-custom { 
          background-color: rgba(255, 0, 0, 0.2) !important; 
          outline: 2px solid red !important; 
        }
        .lien-coupe-info-custom {
          position: absolute; top: 100%; left: 0; background: #fff;
          border: 1px solid #ccc; padding: 8px; font-size: 12px;
          z-index: 10000; max-width: 300px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          display: none; color: black; text-align: left; line-height: 1.4;
        }
        .lien-coupe-highlight-custom:hover .lien-coupe-info-custom { display: block; }
      `;
            document.head.appendChild(style);
        }

        problemes.forEach((p, index) => {
            p.lien.classList.add('lien-coupe-highlight-custom');
            const infoDiv = document.createElement('div');
            infoDiv.className = 'lien-coupe-info-custom';
            infoDiv.innerHTML = `
        <b>Problème #${index + 1}</b><br>
        Texte actuel: "<code>${p.texte.replace(/&/g, '&').replace(/</g, '<')}</code>"<br>
        Précédent direct: "<code>${p.textePrecedentDirect.slice(-20).replace(/&/g, '&').replace(/</g, '<')}</code>"<br>
        Caractère suspect: "<code>${p.caractereManquant.replace(/&/g, '&').replace(/</g, '<')}</code>"<br>
        Suggestion: "<code>${p.texteCompletSuggere.replace(/&/g, '&').replace(/</g, '<')}</code>"
      `;
            const currentPosition = window.getComputedStyle(p.lien).position;
            if (currentPosition === 'static') {
                p.lien.dataset.originalPosition = 'static';
                p.lien.style.position = 'relative';
            }
            p.lien.appendChild(infoDiv);
        });

        let panneauResume = document.getElementById('panneau-resume-liens-custom');
        if (!panneauResume) {
            panneauResume = document.createElement('div');
            panneauResume.id = 'panneau-resume-liens-custom';
            panneauResume.style.cssText = `
            position: fixed; bottom: 10px; right: 10px; padding: 10px 15px;
            background-color: rgba(255, 0, 0, 0.8); color: white; border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 9999;
            font-size: 14px; font-weight: bold;
        `;
            document.body.appendChild(panneauResume);
        }
        panneauResume.textContent = `${problemes.length} problèmes de liens détectés. Survolez les éléments en rouge.`;
        console.log(`%c${problemes.length} problèmes mis en évidence.`, 'color:red; font-weight:bold');
    }



    /**
     * Obtient un chemin HTML pour identifier un élément
     */
    function obtenirCheminHTML(element) {
        const chemin = [];
        let currentElement = element;
        while (currentElement && currentElement.tagName && currentElement.tagName.toLowerCase() !== 'body') {
            let selecteur = currentElement.tagName.toLowerCase();
            if (currentElement.id) {
                selecteur += '#' + currentElement.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
                chemin.unshift(selecteur); // Si ID, c'est suffisant pour ce segment
                break; // On peut souvent s'arrêter à un ID unique
            } else {
                let classSelector = Array.from(currentElement.classList)
                    .map(c => c.replace(/[^a-zA-Z0-9_-]/g, '\\$&'))
                    .join('.');
                if (classSelector) selecteur += '.' + classSelector;

                const parent = currentElement.parentNode;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    const memeTagSiblings = siblings.filter(sibling => sibling.tagName === currentElement.tagName);
                    if (memeTagSiblings.length > 1) {
                        const index = memeTagSiblings.indexOf(currentElement);
                        selecteur += `:nth-of-type(${index + 1})`;
                    }
                }
            }
            chemin.unshift(selecteur);
            if (currentElement.classList.contains('dmNewParagraph')) break; // Arrêter au conteneur parent d'intérêt
            currentElement = currentElement.parentNode;
        }
        if (currentElement && currentElement.tagName.toLowerCase() === 'body') {
            chemin.unshift('body');
        } else if (chemin.length === 0 && element.id) { // Cas d'un élément orphelin avec ID
            chemin.unshift(element.tagName.toLowerCase() + '#' + element.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
        }
        return chemin.join(' > ');
    }

    /**
     * Fonction principale - lance la vérification et l'affichage
     */
    function lancerVerificationComplete() {
        console.log("Lancement de la vérification complète...");
        const problemesDetectes = verifierLiensCoupes();
        mettreEnEvidenceLiensCoupes(problemesDetectes);
        return problemesDetectes;
    }

    window.debugLiensCoupes = {
        verifier: verifierLiensCoupes,
        mettreEnEvidence: mettreEnEvidenceLiensCoupes,
        lancerTout: lancerVerificationComplete,
        obtenirChemin: obtenirCheminHTML
    };

    console.log("Script de détection des liens coupés chargé. Utilisez window.debugLiensCoupes.lancerTout() pour démarrer.");
    lancerVerificationComplete();
})();