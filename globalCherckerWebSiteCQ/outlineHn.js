javascript: (() => {
    // Constantes pour les couleurs et styles
    const COLORS = {
        valid: 'green',
        invalid: 'orange',
        textColor: 'white'
    };

    // Fonction pour vérifier la validité d'un heading par rapport au précédent
    const isHeadingValid = (currentHn, previousHn) => {
        if (!previousHn) return true; // Premier heading toujours valide

        const currentHnIndex = parseInt(currentHn.charAt(1));
        const previousHnIndex = parseInt(previousHn.charAt(1));

        return currentHn !== previousHn && currentHnIndex === previousHnIndex + 1;
    };

    // Fonction pour vérifier les H1 dupliqués
    const hasDuplicateH1 = () => {
        const h1Tags = document.querySelectorAll('h1');
        return h1Tags.length > 1;
    };

    // Fonction pour générer le style d'un heading
    const getHeadingStyle = (isValid, currentHnIndex, parentStyle) => {
        const backgroundColor = isValid ? parentStyle.backgroundColor : COLORS.invalid;
        const margin = currentHnIndex * 50;

        return `margin-left: ${margin}px; color: ${COLORS.valid}; display: flex; align-items: center; background-color: ${backgroundColor};`;
    };

    // Fonction pour générer le style d'un span
    const getSpanStyle = (isValid, isMissingHeading) => {
        const backgroundColor = isMissingHeading ? COLORS.invalid : COLORS.valid;
        return `color: ${COLORS.textColor}; background: ${backgroundColor}; text-transform: uppercase; padding: 5px 20px;`;
    };

    // Fonction pour générer le HTML d'un heading
    const createHeadingHTML = (tagName, content, isValid, isMissingHeading, isDuplicate, hnIndex, parentStyle) => {
        const headingStyle = getHeadingStyle(isValid, hnIndex, parentStyle);
        const spanStyle = getSpanStyle(isValid, isMissingHeading);
        const className = isDuplicate ? 'duplicate' : isMissingHeading ? 'missing' : '';

        let prefix = '';
        if (isDuplicate) {
            prefix = '<span style="' + spanStyle + '">Warning: Duplicate H1</span> - ';
        } else {
            prefix = '<span style="' + spanStyle + '">' + tagName + '</span> - ';
        }

        return `<${tagName} class="${className}" style="${headingStyle}">${prefix}${content}</${tagName}><br>`;
    };

    // Collecter tous les headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const hasMultipleH1 = hasDuplicateH1();

    // Générer la structure HTML
    let structure = '';
    let previousHn = null;

    headings.forEach((heading, index) => {
        const currentHn = heading.tagName.toLowerCase();
        const currentHnContent = heading.innerText;
        const currentHnIndex = parseInt(currentHn.charAt(1));
        const parentStyle = window.getComputedStyle(heading);
        const isValid = isHeadingValid(currentHn, previousHn);

        // Ajouter les headings manquants si nécessaire
        if (previousHn && !isValid && currentHnIndex > parseInt(previousHn.charAt(1)) + 1) {
            const missingHeadingsCount = currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);

            for (let i = 1; i <= missingHeadingsCount; i++) {
                const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
                const missingHn = `h${missingHnIndex}`;
                const missingHnContent = `Missing Heading - ${missingHn}`;

                structure += createHeadingHTML(
                    missingHn,
                    missingHnContent,
                    false,
                    true,
                    false,
                    missingHnIndex,
                    parentStyle
                );
            }
        }

        // Vérifier si c'est un H1 dupliqué
        const isDuplicate = currentHn === 'h1' && hasMultipleH1 && index > 0;

        // Ajouter le heading actuel
        structure += createHeadingHTML(
            currentHn,
            currentHnContent,
            !isDuplicate,
            false,
            isDuplicate,
            currentHnIndex,
            parentStyle
        );

        previousHn = currentHn;
    });

    // Afficher les résultats
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
    <html>
      <head>
        <title>Structure corrigée</title>
        <style>
          .missing {
            background-color: white !important;
            color: ${COLORS.invalid} !important;
          }
          .noMissingHeading { 
            background-color: ${COLORS.valid}; 
          }
          .duplicate { 
            background-color: ${COLORS.invalid}; 
          }
        </style>
      </head>
      <body>${structure}</body>
    </html>
  `);
    newWindow.document.close();
})();