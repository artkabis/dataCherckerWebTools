(() => {
  // Fonction pour récupérer le texte lisible à partir d'un élément DOM en excluant les classes spécifiées
  function getTextFromElement(element, excludedClasses) {
    return [...element.childNodes]
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          const classes = node.classList;

          // Vérifier si l'élément a une classe à exclure
          if (
            excludedClasses.some((className) => classes.contains(className))
          ) {
            return "";
          }

          if (tagName !== "script" && tagName !== "style") {
            // Exclure les balises SCRIPT et STYLE (ou ajouter d'autres balises à exclure si nécessaire)
            return getTextFromElement(node, excludedClasses);
          }
        }
        return "";
      })
      .join(" ");
  }

  // Fonction pour exclure les mots spécifiés du texte en utilisant replaceAll
  function excludeWordsFromText(text, excludedWords) {
    if (excludedWords.length === 0) {
      return text;
    }

    // Remplacer tous les mots spécifiés par une chaîne vide
    let textWithoutExcludedWords = text;
    for (const word of excludedWords) {
      textWithoutExcludedWords = textWithoutExcludedWords.replaceAll(word, "");
    }

    return textWithoutExcludedWords;
  }

  // Fonction pour compter les mots en excluant les espaces dans les numéros de téléphone francophones
  function countWords(text) {
    // Expression régulière pour détecter les numéros de téléphone francophones
    const phonePattern = /\d{2} \d{2} \d{2} \d{2} \d{2}/g;

    // Exclure les espaces dans les numéros de téléphone en remplaçant par un caractère spécial (#)
    const sanitizedText = text.replace(phonePattern, (match) =>
      match.replace(/ /g, "#")
    );

    // Compter les mots en séparant le texte par les espaces et en excluant les caractères spéciaux
    const wordCount = sanitizedText
      .split(/\s+/)
      .filter((word) => !word.includes("#")).length;

    return wordCount;
  }

  // Fonction pour récupérer le texte lisible des éléments correspondant aux sélecteurs en excluant les classes spécifiées et en supprimant les sauts de ligne et les doubles espaces
  function getReadableTextFromSelectors(
    selectors,
    excludedClasses,
    excludedWords
  ) {
    let allText = "";

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const textFromElement = getTextFromElement(element, excludedClasses);
        allText += textFromElement + " ";
      }
    }

    const cleanedText = allText.replace(/\s+/g, " ").trim(); // Supprimer les sauts de ligne et les doubles espaces
    const textWithoutExcludedWords = excludeWordsFromText(
      cleanedText,
      excludedWords
    );

    return textWithoutExcludedWords;
  }

  // Liste des classes à exclure
  const excludedClasses = [
    "vc_btn3-container",
    "pj-prolive-hc",
    "dmButtonLink",
    "proliveContainer",
  ];

  // Liste des mots à exclure
  const replaceWords = [
    "Button",
    "Afficher davantage",
    "John Doe",
    "City skyline",
    "Photo By:",
    "Birthday Sparks",
    "Fashion Magazine",
    "Blurred Lines",
    "Photo by:",
  ];

  // Liste des sélecteurs pour récupérer le texte
  const selectors = [
    "#Content",
    "#dm_content .dmNewParagraph:not(.proliveContainer)",
  ];

  // Appelle la fonction pour récupérer le texte lisible des éléments correspondant aux sélecteurs en excluant les classes spécifiées et en supprimant les sauts de ligne et les doubles espaces
  const textFromSelectors = getReadableTextFromSelectors(
    selectors,
    excludedClasses,
    replaceWords
  );
  console.log("Texte récupéré :", textFromSelectors);

  // Compte les mots en excluant les espaces dans les numéros de téléphone francophones et les mots spécifiés
  const wordCount = countWords(textFromSelectors);
  console.log(
    "Nombre de mots (en excluant les espaces des numéros de téléphone et les mots spécifiés) :",
    wordCount
  );
})();