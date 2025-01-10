if (typeof window.counterWords === 'undefined') {

  const excludedNodes = settingWords.excludedNodes;
  const excludedClasses = settingWords.excludedClasses;
  const replaceWords = settingWords.replaceWords;

  function getTextFromElement(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      return element.textContent.trim();
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const tagName = element.tagName.toLowerCase();
      const classes = element.className;

      if (excludedNodes.includes(tagName) || (classes && classes.split(" ").some(className => excludedClasses.includes(className)))) {
        return "";
      }
      if (element.textContent.trim().split(' ').some(wordBan => replaceWords.includes(wordBan))) {
        return "";
      }

      const parentWordsCounter = (element.closest('.dmRespCol') || element.closest('.vc_column-inner'));
      const childText = Array.from(element.childNodes)
        .map(child => getTextFromElement(child))
        .join(" ")
        .trim();

      if (parentWordsCounter && parentWordsCounter.textContent.split(' ').length <= 15) {
        return "";
      }

      return childText;
    }
    return "";
  }

  let filteredText = $('body #Content, body #dm_content .dmRespCol, body main')
    .map(function () {
      return getTextFromElement(this);
    })
    .get()
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  // Il faudra map le texte afin de replace les words à exclure

  let counterWords = filteredText;
  console.log("Texte récupéré :", filteredText);
  console.log("Nombre de mots liés au texte récupéré :", filteredText.split(' ').length);

  window.counterWords = filteredText;
}