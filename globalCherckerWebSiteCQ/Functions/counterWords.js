counterWords = () =>{
  // Fonction pour récupérer le texte lisible à partir d'un élément DOM en excluant les classes spécifiées
  function getTextFromElement(element, excludedClasses, excludesNodes) {
    return [...element.childNodes]
      .map((node) => {
        const tagName = node?.tagName?.toLowerCase();
        const classes = node.classList;
  
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Vérifier si l'élément a une classe à exclure
          if (
            excludedClasses.some((className) => classes.contains(className))
          ) {
            return "";
          }
          // Exclure les NODES SCRIPT, STYLE, etc.
          const isExcluded = excludesNodes.some((ExcludeNode) => {
            const trimmedLowercaseTag = tagName.toLowerCase().trim();
            return trimmedLowercaseTag === ExcludeNode.toLowerCase().trim();
          });
  
          if (!isExcluded) {
            return node.textContent;
          } else {
            console.log('Node DOM exclude : ', tagName);
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
  const getReadableTextFromSelectors= (
    selectors,
    excludedClasses,
    excludedWords,
    excludesNodes
  ) => {
    let allText = "";

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const textFromElement = getTextFromElement(element, excludedClasses, excludesNodes);
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
  const excludedClasses = settingWords.excludedClasses;

  // Liste des mots à exclure
  const replaceWords = settingWords.replaceWords;
  const exludesNodes = settingWords.excludedNodes;
  console.log({excludedClasses},{replaceWords},{exludesNodes});

  // Liste des sélecteurs pour récupérer le texte
  const selectors = [
    "#Content",
    "#dm_content .dmNewParagraph:not(.proliveContainer)",
    "main"
    //'div[class^="page"]',//, 'body:not(#dmRoot):not(.page) div[class^="content"]', 'div[class*="main"]', '#bodyContent',
  ];

  // Appelle la fonction pour récupérer le texte lisible des éléments correspondant aux sélecteurs en excluant les classes spécifiées et en supprimant les sauts de ligne et les doubles espaces
  const textFromSelectors = getReadableTextFromSelectors(
    selectors ? selectors : ['body'],
    excludedClasses,
    replaceWords,
    exludesNodes
  );
  console.log("Texte récupéré :", textFromSelectors);

  // Compte les mots en excluant les espaces dans les numéros de téléphone francophones et les mots spécifiés
  const wordCount = countWords(textFromSelectors);
  console.log(
    "Nombre de mots (en excluant les espaces des numéros de téléphone et les mots spécifiés) :",
    wordCount
  );
  return {words:textFromSelectors, count_words :wordCount};
}
counterWords();
//wordsCounterContent = counterWords();


