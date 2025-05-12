function verifierLiensCoupes() {
    // Récupérer tous les liens
    const liens = document.querySelectorAll('a');
    const problemes = [];

    liens.forEach(lien => {
        const texte = lien.textContent.trim();

        // Ignorer les liens vides
        if (!texte || texte.length === 0) return;

        // Récupérer le paragraphe parent ou autre conteneur
        const conteneur = lien.closest('p, div, li, span');
        if (!conteneur) return;

        // Obtenir l'HTML du conteneur
        const htmlConteneur = conteneur.innerHTML;

        // Trouver la position du lien dans le HTML
        const positionLien = htmlConteneur.indexOf(lien.outerHTML);
        if (positionLien <= 0) return;

        // Récupérer le HTML précédant le lien (jusqu'à 100 caractères)
        const htmlAvantLien = htmlConteneur.substring(Math.max(0, positionLien - 100), positionLien);

        // Créer un élément temporaire pour convertir le HTML en texte
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlAvantLien;
        const texteAvantLien = tempDiv.textContent;

        // Vérifier si le texte avant le lien se termine par une lettre sans espace après
        const dernierCaractere = texteAvantLien.slice(-1);

        // Vérifier si le dernier caractère est une lettre (pas un espace, pas un signe de ponctuation)
        if (/[a-zàáâäçèéêëìíîïñòóôöùúûüA-ZÀÁÂÄÇÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜ]/.test(dernierCaractere)) {
            // Vérifier si le dernier caractère n'est pas suivi d'un espace
            const avantLienFinitParEspace = texteAvantLien.endsWith(' ') ||
                texteAvantLien.endsWith('&nbsp;') ||
                texteAvantLien.endsWith('\t') ||
                texteAvantLien.endsWith('\n');

            if (!avantLienFinitParEspace) {
                // Récupérer le premier mot du lien
                const premierMotLien = texte.split(' ')[0];

                // Créer un "mot potentiel" en combinant le dernier caractère avant le lien
                // et le premier mot du lien
                const motPotentiel = dernierCaractere + premierMotLien;

                problemes.push({
                    lien: lien,
                    type: "lien_probablement_coupe",
                    texte: texte,
                    html: lien.outerHTML,
                    contexteAvant: texteAvantLien.slice(-30),
                    caractereManquant: dernierCaractere,
                    premierMotLien: premierMotLien,
                    motSuggere: motPotentiel,
                    texteCompletSuggere: dernierCaractere + texte
                });
            }
        }
    });

    // Afficher les résultats
    if (problemes.length > 0) {
        console.log(`%c${problemes.length} problèmes de liens coupés détectés`, 'color:red; font-weight:bold');
        console.table(problemes.map(p => ({
            "lien": p.lien,
            "Type": p.type,
            "Texte du lien": p.texte,
            "Contexte avant": p.contexteAvant,
            "Caractère manquant": p.caractereManquant,
            "Premier mot du lien": p.premierMotLien,
            "Texte suggéré": p.texteCompletSuggere
        })));

        // Afficher plus de détails sur chaque problème
        problemes.forEach((p, index) => {
            console.log(`%cProblème #${index + 1}`, 'color:red; font-weight:bold');
            console.log(`Texte avant le lien: "${p.contexteAvant}"`);
            console.log(`Texte du lien: "${p.texte}"`);
            console.log(`Texte complet suggéré: "${p.texteCompletSuggere}"`);
            console.log(`HTML: ${p.html}`);
            console.log('-------------------------------------------');
        });
    } else {
        console.log('%cAucun problème de lien coupé détecté', 'color:green; font-weight:bold');
    }

    return problemes;
}

// Exécuter la fonction
verifierLiensCoupes();