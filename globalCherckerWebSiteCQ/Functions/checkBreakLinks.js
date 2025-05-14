/**
 * Détecte les liens qui pourraient être "coupés" - c'est-à-dire quand une lettre 
 * qui devrait faire partie du texte du lien se trouve juste avant celui-ci.
 * @returns {Array} - Liste des problèmes détectés
 */
function verifierLiensCoupes() {
    console.log("%cDébut de la vérification des liens coupés...", "color:blue; font-weight:bold");

    // Récupérer tous les liens
    const liens = document.querySelectorAll('a');
    const problemes = [];

    // Set pour éviter les doublons
    const liensTraites = new Set();

    // Pour chaque conteneur de texte
    document.querySelectorAll('p, div, li, td, article').forEach((conteneur) => {
        // Récupérer tous les liens dans ce conteneur
        const liensConteneur = conteneur.querySelectorAll('a');
        if (liensConteneur.length === 0) return;

        // Obtenir le texte complet du conteneur
        const texteComplet = conteneur.textContent;

        // Pour chaque lien dans ce conteneur
        liensConteneur.forEach((lien) => {
            // Vérifier si nous avons déjà traité ce lien
            const lienId = lien.href + "_" + lien.textContent;
            if (liensTraites.has(lienId)) return;

            // Marquer le lien comme traité
            liensTraites.add(lienId);

            // Ignorer les liens vides ou avec seulement des images
            const texteLien = lien.textContent.trim();
            if (!texteLien || lien.querySelector('img')) return;

            // Récupérer la position du texte du lien dans le texte complet
            const positionLien = texteComplet.indexOf(texteLien);
            if (positionLien <= 0) return; // Lien pas trouvé ou au début

            // Extraire les 20 caractères avant le lien (ou moins si pas assez de texte)
            const nbCaracteres = 20;
            const debutPos = Math.max(0, positionLien - nbCaracteres);
            const texteAvant = texteComplet.substring(debutPos, positionLien);

            // Vérifier si le texte avant se termine par une lettre (sans espace après)
            const texteAvantTrim = texteAvant.trimRight();

            // Vérifier si le dernier caractère est une lettre
            const dernierCaractere = texteAvantTrim.slice(-1);
            const estLettre = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ]/.test(dernierCaractere);

            // Vérifier si le premier caractère du lien est une lettre
            const premierCaractere = texteLien.charAt(0);
            const premierEstLettre = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ]/.test(premierCaractere);

            // La règle simple : si le dernier caractère avant est une lettre,
            // le premier caractère du lien est une lettre,
            // et il n'y a pas d'espace à la fin du texte avant
            if (estLettre && premierEstLettre && !texteAvant.endsWith(" ")) {
                console.log(`Problème détecté dans le lien: "${texteLien}"`);

                problemes.push({
                    lien: lien,
                    type: "lien_probablement_coupe",
                    texte: texteLien,
                    html: lien.outerHTML,
                    contexteAvant: texteAvant,
                    caractereManquant: dernierCaractere,
                    premierMotLien: texteLien.split(/\s+/)[0],
                    texteCompletSuggere: dernierCaractere + texteLien
                });
            }
        });
    });

    // Afficher les résultats
    if (problemes.length > 0) {
        console.log(`%c${problemes.length} problèmes de liens coupés détectés`, 'color:red; font-weight:bold; font-size: 14px; background: #f5f5f5; padding: 5px;');

        // Afficher un tableau résumé
        console.table(problemes.map(p => ({
            "Texte du lien": p.texte,
            "Contexte avant": p.contexteAvant,
            "Caractère manquant": p.caractereManquant,
            "Texte suggéré": p.texteCompletSuggere
        })));

        // Afficher les détails de chaque problème
        problemes.forEach((p, index) => {
            console.group(`%cProblème #${index + 1}`, 'color:red; font-weight:bold');
            console.log(`Texte avant: "${p.contexteAvant}"`);
            console.log(`Texte du lien: "${p.texte}"`);
            console.log(`Correction suggérée: "${p.texteCompletSuggere}"`);

            // Afficher l'élément DOM pour faciliter le débogage
            console.log('Élément:', p.lien);
            console.log('HTML:', p.html);
            console.groupEnd();
        });

        // Proposer une fonction de correction automatique
        console.log('%cUtilisez correctionAutomatique() pour appliquer les corrections suggérées', 'color:blue; font-weight:bold');
    } else {
        console.log('%cAucun problème de lien coupé détecté', 'color:green; font-weight:bold; font-size: 14px; background: #f5f5f5; padding: 5px;');
    }

    return problemes;
}

/**
 * Fonction pour appliquer automatiquement les corrections suggérées
 * @param {Array} problemes - Liste des problèmes détectés par verifierLiensCoupes()
 * @returns {Number} - Nombre de corrections appliquées
 */
function correctionAutomatique(problemes = null) {
    // Si aucun problème n'est fourni, exécuter la vérification
    if (!problemes) {
        problemes = verifierLiensCoupes();
    }

    if (problemes.length === 0) {
        console.log('%cAucune correction à appliquer', 'color:blue; font-weight:bold');
        return 0;
    }

    let corrections = 0;

    problemes.forEach(p => {
        try {
            // Stratégie de correction: Modifier le HTML directement

            // 1. Trouver le nœud texte contenant le caractère à déplacer
            let previousTextNode = null;
            let node = p.lien.previousSibling;

            // Parcourir les nœuds précédents pour trouver le dernier nœud texte
            while (node && !previousTextNode) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(p.caractereManquant)) {
                    previousTextNode = node;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Chercher dans les enfants de ce nœud
                    const textNodes = [];
                    const findTextNodes = function (n) {
                        if (n.nodeType === Node.TEXT_NODE) {
                            textNodes.push(n);
                        } else if (n.nodeType === Node.ELEMENT_NODE) {
                            for (let i = 0; i < n.childNodes.length; i++) {
                                findTextNodes(n.childNodes[i]);
                            }
                        }
                    };

                    findTextNodes(node);

                    // Vérifier si le dernier nœud texte contient le caractère manquant
                    const lastTextNode = textNodes[textNodes.length - 1];
                    if (lastTextNode && lastTextNode.textContent.includes(p.caractereManquant)) {
                        previousTextNode = lastTextNode;
                    }
                }
                node = node.previousSibling;
            }

            // Si on a trouvé le nœud texte précédent
            if (previousTextNode) {
                // Supprimer le caractère manquant du nœud texte précédent
                const originalText = previousTextNode.textContent;
                const newText = originalText.substring(0, originalText.lastIndexOf(p.caractereManquant));
                previousTextNode.textContent = newText;

                // Ajouter le caractère au début du texte du lien
                p.lien.textContent = p.caractereManquant + p.lien.textContent;

                corrections++;
            } else {
                // Approche alternative: simplement ajouter le caractère au début du lien
                p.lien.textContent = p.caractereManquant + p.lien.textContent;
                console.warn('Nœud texte précédent non trouvé, caractère ajouté au lien sans suppression');
                corrections++;
            }
        } catch (e) {
            console.error('Erreur lors de la correction:', e);
        }
    });

    console.log(`%c${corrections} corrections appliquées`, 'color:green; font-weight:bold');
    return corrections;
}

// Exécuter la fonction
const problemes = verifierLiensCoupes();