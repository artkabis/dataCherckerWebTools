function verifierLiensCoupes() {
    // Récupérer tous les liens
    const liens = document.querySelectorAll('a');
    const problemes = [];

    liens.forEach(lien => {
        const texte = lien.textContent.trim();

        // Ignorer les liens vides
        if (!texte || texte.length === 0) return;

        // PARTIE 1: Vérification des liens commençant par une minuscule
        if (/^[a-zàáâäçèéêëìíîïñòóôöùúûü]/.test(texte)) {
            let estJustifie = false;

            // Récupérer le paragraphe parent
            const paragraphe = lien.closest('p, div, li');
            if (paragraphe) {
                // Obtenir l'HTML du paragraphe
                const htmlParagraphe = paragraphe.innerHTML;

                // Trouver la position du lien dans le HTML
                const positionLien = htmlParagraphe.indexOf(lien.outerHTML);

                if (positionLien > 0) {
                    // Récupérer le HTML précédant le lien (jusqu'à 100 caractères)
                    const htmlAvantLien = htmlParagraphe.substring(Math.max(0, positionLien - 100), positionLien);

                    // Convertir le HTML en texte brut
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlAvantLien;
                    const texteAvantLien = tempDiv.textContent.trim();

                    // Vérifier les 20 derniers caractères avant le lien
                    const derniersCaracteres = texteAvantLien.slice(-20).trim();

                    // Liste de mots/expressions qui justifient une minuscule suivante
                    const justifications = [
                        'de ', 'des ', 'du ', 'pour ', 'par ', 'sur ', 'avec ', 'et ', 'ou ',
                        'au ', 'aux ', 'le ', 'la ', 'les ', 'nos ', 'vos ', 'ces ', 'un ', 'une ',
                        'demande de', 'besoin de', 'envie de'
                    ];

                    // Vérifier si l'un des mots/expressions justifie la minuscule
                    estJustifie = justifications.some(mot => derniersCaracteres.endsWith(mot));

                    // Si la phrase n'est pas terminée, c'est aussi justifié
                    if (!estJustifie && derniersCaracteres.length > 0 &&
                        /[a-zàáâäçèéêëìíîïñòóôöùúûü]$/.test(derniersCaracteres) &&
                        !derniersCaracteres.endsWith('.')) {
                        estJustifie = true;
                    }
                }
            }

            // Si la minuscule n'est pas justifiée, c'est probablement une erreur
            if (!estJustifie) {
                problemes.push({
                    type: "texte_commence_par_minuscule",
                    texte: texte,
                    html: lien.outerHTML,
                    contexte: paragraphe ? paragraphe.innerHTML.substring(0, 200) : '',
                    justification: "Commence par une minuscule sans être dans la continuité d'une phrase"
                });
            }
        }

        // PARTIE 2: Détection de lettres manquantes au début des mots
        const premierMot = texte.split(' ')[0].toLowerCase();

        // Liste de mots problématiques connus
        const motsProblematiques = {
            'ortes': 'p',  // portes
            'orte': 'p',   // porte
            'oiture': 'v', // voiture
            'enetre': 'f', // fenetre
            'arage': 'g',  // garage
            'itrage': 'v'  // vitrage
        };

        for (const [motPartiel, lettre] of Object.entries(motsProblematiques)) {
            if (premierMot === motPartiel ||
                premierMot.startsWith(motPartiel + 's') ||
                premierMot.startsWith(motPartiel + ' ') ||
                premierMot.startsWith(motPartiel + "d'")) {
                problemes.push({
                    type: "lettre_manquante_probable",
                    texte: texte,
                    html: lien.outerHTML,
                    motProblematique: premierMot,
                    lettreManquante: lettre,
                    motCorrect: lettre + motPartiel
                });
                break;
            }
        }
    });
    problemes?.length && (
        console.log(`%c${problemes.length} problèmes de liens détectés`, 'color:red'),
        console.table(problemes.map(p => ({
            "Type": p.type,
            "Texte": p.texte,
            "HTML": p.html,
            "Contexte": p.contexte,
            "Justification": p.justification || '',
            "Mot problématique": p.motProblematique || '',
            "Lettre manquante": p.lettreManquante || '',
            "Mot correct": p.motCorrect || ''
        })))

    );
}
verifierLiensCoupes()