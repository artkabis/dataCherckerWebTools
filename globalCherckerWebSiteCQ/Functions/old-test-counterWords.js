settingWords={};

  // Exlusion de ces termes dans l'affichage des Hn de la page web (headings)
  settingWords.exclusesWords = [
    ":",
    "(",
    ")", 
    "?",
    "!",
    "&",
    "a",
    "à",
    "à laquelle",
    "afin",
    "alentours",
    "aller",
    'apporte',
    'apportent',
    "après",
    "au",
    "aucun",
    "aucune",
    "aucunes",
    "aucuns",
    "auquel",
    "autrui",
    "aux",
    "auxquelles",
    "auxquels",
    "avec",
    'besoins',
    'besoin',
    "c'est",
    "c’est",
    "ça",
    "ce",
    "ceci",
    "cela",
    "celle",
    "celle-ci",
    "celle-là",
    "celles",
    "celles-ci",
    "celles-là",
    "celui",
    "celui-ci",
    "celui-là",
    "cette",
    "certaine",
    "certaines",
    "certains",
    "ces",
    "ceux",
    "ceux-ci",
    "ceux-là",
    "chacun",
    "chacune",
    "comme",
    "commencé",
    "d'",
    "d’",
    "d’aucun",
    "d’aucuns",
    "d'autres",
    "d'un",
    "dans",
    "de",
    "de laquelle",
    "depuis",
    "des",
    "désormais",
    "desquelles",
    "desquels",
    "dont",
    "du",
    "duquel",
    "effet",
    "également",
    "elle",
    "elles",
    "en",
    "encore",
    "Encore",
    "et",
    "être",
    "etc",
    "est",
    "eux",
    "faire",
    'grâce',
    "il",
    "ils",
    "je",
    "l'",
    "l’",
    "l'autre",
    "l'un",
    "l'une",
    "la",
    "la leur",
    "la même",
    "la mienne",
    "la nôtre",
    "la sienne",
    "la tienne",
    "la vôtre",
    "laquelle",
    "le",
    "le leur",
    "le même",
    "le mien",
    "le nôtre",
    "le sien",
    "le tien",
    "le vôtre",
    "lequel",
    "les",
    "les autres",
    "les leurs",
    "les mêmes",
    "les miennes",
    "les miens",
    "les nôtres",
    "les siennes",
    "les siens",
    "les tiennes",
    "les tiens",
    "les unes",
    "les uns",
    "les vôtres",
    "lesquelles",
    "lesquels",
    "leur",
    "lui",
    "m’",
    'mais',
    "me",
    "moi",
    "non",
    "nos",
    "Nos",
    "notre",
    "nous",
    "nul",
    "nulle",
    "nulles",
    "nuls",
    "on",
    "ou",
    "où",
    "ouvrir",
    "par",
    "pas",
    "personne",
    "peut",
    "plus",
    "plusieurs",
    "pour",
    "près",
    "qu'est-ce",
    "que",
    "quelles",
    "Quelles",
    "quelqu'un",
    "quelqu'une",
    "quelque chose",
    "quelques unes",
    "quelques uns",
    "quels",
    "Quels",
    "qui",
    "quiconque",
    "quoi",
    "rien",
    "sa",
    "se",
    "selon",
    "ses",
    "soi",
    "son",
    "sont",
    "sur",
    "t’",
    "te",
    "tel",
    "telle",
    "telles",
    "tels",
    "toi",
    "tous",
    "tout",
    "toute",
    "toutes",
    "très",
    "tu",
    "un",
    "un autre",
    "une",
    "une autre",
    "utilisons",
    "vers",
    "vos",
    "votre",
    "vous",
    "y"
];

//Classes exclues dans la récupération des mot de la page web
  settingWords.excludedClasses = [
    "vc_btn3-container",
    "vc_btn3",
    "pj-prolive-hc",
    "dmButtonLink",
    "proliveContainer",
    'vc_mappy-map'
  ];
  //Noeuds exclus dans la récupération des mot de la page web
  settingWords.excludedNodes = [
    "iframe",
    "button",
    "textarea",
    "script",
    "style",
    "source",
    "video",
    "picture",
    "form",
    "code",
    "frameset",
    "noframes",
    "map",
    "area",
    "figcaption",
    "figure",
    "svg",
    "nav",
    "menu",
    "menuitem",
    "footer",
    "noscript",
    "embed",
    "param",
    "rs-module-wrap",
    "rs-layer-wrap",
    "head",
    "header"
  ];

  // Liste des mots à exclure
  settingWords.replaceWords = [
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
  counterWords = () => {
  const littleText = [];
    function isPhoneNumber(text) {
        const phonePattern = /\d{2} \d{2} \d{2} \d{2} \d{2}/g;
        return text.match(phonePattern) !== null;
      }

  function isNodeExcluded(node, excludedNodes) {
    const tagName = node.tagName?.toLowerCase();
    return excludedNodes.includes(tagName);
  }

  function getTextFromElement(element, excludedNodes) {
               

    if (element.nodeType === Node.TEXT_NODE) {
      return element.textContent;
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      if (isNodeExcluded(element, excludedNodes)) {
        return "";
      }

      const childNodesText = Array.from(element.childNodes)
        .map((node) => getTextFromElement(node, excludedNodes))
        .join(" ");

      return childNodesText.trim();
    }
    return "";
  }

  function countWords(text) {
      return text.split(" ").length
  }

function getReadableTextFromSelectors(selectors, excludedNodes) {
  let allText = "";

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      const textFromElement = getTextFromElement(element, excludedNodes);
      const parentWordsCounter = (element.closest('.dmRespCol')) ? element.closest('.dmRespCol').textContent.split(' ').length : (element.closest('.vc_column-inner')) ? element.closest('.vc_column-inner').textContent.split(' ').length : element?.parentNode?.parentNode?.parentNode?.textContent?.split(' ')?.length;

      console.log({ parentWordsCounter });

      if (textFromElement && parentWordsCounter > 15) {
        allText += textFromElement + " ";
      }
    });
  }

  const cleanedText = allText.replace(/\s+/g, " ").replace(/\d{2} \d{2} \d{2} \d{2} \d{2}/g, '').trim();
  return cleanedText;
}


  const excludedClasses = settingWords.excludedClasses;
  const replaceWords = settingWords.replaceWords;
  const excludedNodes = settingWords.excludedNodes;

  const selectors = ["#Content, #site_content"];

  const textFromSelectors = getReadableTextFromSelectors(
    selectors,
    excludedNodes
  );
  console.log("Texte récupéré :", textFromSelectors);

  const wordCount = countWords(textFromSelectors);
  console.log("Nombre de mots :", wordCount);

  return { words: textFromSelectors, count_words: wordCount };
};

counterWords();