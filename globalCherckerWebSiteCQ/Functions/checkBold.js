// Configuration
const MIN_BOLD_EXPRESSION = (typeof currentSettings !== 'undefined' && currentSettings?.MIN_BOLD_EXPRESSION) || 3;
const MAX_BOLD_EXPRESSION = (typeof currentSettings !== 'undefined' && currentSettings?.MAX_BOLD_EXPRESSION) || 5;
const MIN_PARENT_WORDS = 20; // Nombre minimal de mots dans un parent pour considérer un élément en gras

(($) => {
  // Fonction améliorée pour détecter les éléments en gras
  const isBold = (el) => {
    if (!el || !el.length) return false;

    // Vérification du style font-weight
    if (el.attr("style")) {
      const style = el.attr("style");
      if (style.includes("font-weight:")) {
        const weightMatch = style.match(/font-weight:\s*(\d+|bold|bolder)/i);
        if (weightMatch) {
          const weight = weightMatch[1];
          if (weight === "bold" || weight === "bolder" || parseInt(weight, 10) >= 600) {
            return el[0].textContent.trim().length > 0;
          }
        }
      }
    }

    // Vérification de la propriété computedStyle comme alternative
    if (el[0] && window.getComputedStyle) {
      const computedStyle = window.getComputedStyle(el[0]);
      const fontWeight = computedStyle.getPropertyValue('font-weight');
      if (fontWeight && (fontWeight === 'bold' || fontWeight === 'bolder' || parseInt(fontWeight, 10) >= 600)) {
        return el[0].textContent.trim().length > 0;
      }
    }

    return false;
  };

  // Vérifie si l'élément contient des spans imbriqués en gras
  const isMultiSpan = (el) => {
    if (!el || !el.length) return false;
    return isBold(el) && el.children().length > 0 && isBold($(el.children()[0]));
  };

  // Vérifie si l'élément est un titre ou est contenu dans un titre
  const isHeading = (el) => {
    if (!el || !el.length) return false;

    const tagName = el[0].tagName.toLowerCase();
    if (tagName.match(/^h[1-6]$/)) return true;

    // Rechercher les parents qui sont des titres
    for (let i = 1; i <= 6; i++) {
      if (el.parents(`h${i}`).length) return true;
    }

    return false;
  };

  // Vérifie si l'élément est un lien ou est contenu dans un lien
  const isLink = (el) => {
    if (!el || !el.length) return false;
    return el[0].tagName.toLowerCase() === "a" || el.parents("a").length > 0;
  };

  // Trouve le parent significatif d'un élément
  const findSignificantParent = (el) => {
    if (!el || !el.length) return $();

    const isDuda = $('#dm').length > 0;
    const isWP = $('#Content').length > 0;

    if (isDuda) {
      const dmPara = el.closest(".dmNewParagraph");
      return dmPara.length ? dmPara : el.closest(".dmRespCol");
    } else if (isWP) {
      const textColumn = el.closest('.wpb_text_column');
      if (textColumn.length) return textColumn;

      const toggleContent = el.closest('.wpb_toggle_content');
      if (toggleContent.length) return toggleContent;
    }

    // Essayons de trouver un parent paragraphe
    const paragraph = el.closest('p');
    if (paragraph.length) return paragraph;

    // Fallback: remonter de 3 niveaux comme dans le code original
    return el.parent().parent().parent();
  };

  // Compte le nombre de mots dans un élément
  const countWords = (element) => {
    if (!element || !element.length) return 0;
    const text = element[0].textContent.trim();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  // Collecte tous les éléments en gras
  const collectBoldElements = () => {
    const boldElements = [];
    const isDuda = $('#dm').length > 0;
    const isWP = $('#Content').length > 0;

    // Collecte à partir des balises strong et b
    $("b, strong, STRONG, B").each(function () {
      const $this = $(this);
      if ($this[0].textContent.trim().length <= 1) return;

      const parent = findSignificantParent($this);
      const parentWordCount = countWords(parent);

      // Vérification des conditions pour exclure les éléments
      const isSlideDuda = isDuda && $this.closest(".slide-inner").length > 0;
      const isContentDataBinding = isDuda && $this.find("div[data-binding]").length > 0;
      const isFooter = $this.closest("#Footer").length > 0;

      if (!isHeading($this) && !isLink($this) &&
        parentWordCount >= MIN_PARENT_WORDS &&
        !isSlideDuda && !isContentDataBinding && !isFooter) {

        boldElements.push({
          target: $this[0],
          text: $this[0].textContent.trim(),
          nbWords: $this[0].textContent.trim().split(/\s+/).filter(Boolean).length,
          nbWordsParent: parentWordCount
        });
      }
    });

    // Si nous sommes sur Duda, collecte aussi les spans avec style en gras
    if (isDuda) {
      $("#dm_content span:not(.alt_tooltip)").each(function () {
        const $this = $(this);
        const isSlide = $this.closest(".slide-inner").length > 0;
        const isContentDataBinding = $this.find("div[data-binding]").length > 0;
        const isFooter = $this.closest("#Footer").length > 0;

        // Gère les spans imbriqués
        const isMultiSpanned = isMultiSpan($this);
        const target = isMultiSpanned ? $this.children().first() : $this;

        // Évite les doublons pour les multi-spans
        const duplicateBoldSpan = isMultiSpanned &&
          $this[0].textContent.trim().includes(target[0].textContent.trim());

        const parent = findSignificantParent($this);
        const parentWordCount = countWords(parent);

        if (isBold(target) &&
          !isHeading($this) &&
          !isContentDataBinding &&
          !isSlide &&
          !isFooter &&
          target[0].textContent.trim().length > 1 &&
          !duplicateBoldSpan &&
          parentWordCount >= MIN_PARENT_WORDS) {

          boldElements.push({
            target: target[0],
            text: target[0].textContent.trim(),
            nbWords: target[0].textContent.trim().split(/\s+/).filter(Boolean).length,
            nbWordsParent: parentWordCount
          });
        }
      });
    }

    return boldElements;
  };

  // Filtre les éléments en gras pour éliminer les doublons
  const filterUniqueBoldElements = (boldArray) => {
    const uniqueElements = [];
    const textSeen = new Set();

    boldArray.forEach(element => {
      const { target, text, nbWords, nbWordsParent } = element;

      // Utilise une combinaison du texte et du nombre de mots comme clé unique
      const uniqueKey = `${text}_${nbWords}`;

      if (text.length > 2 &&
        !$(target).closest(".slide-inner").length &&
        !$(target).closest("#Footer").length &&
        nbWordsParent >= MIN_PARENT_WORDS &&
        !textSeen.has(uniqueKey)) {

        textSeen.add(uniqueKey);
        uniqueElements.push({
          target,
          text,
          nbWords,
          nbWordsParent
        });
      }
    });

    return uniqueElements;
  };

  // Calcule le score en fonction du nombre d'éléments en gras
  const calculateBoldScore = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 4;
    if (count >= MIN_BOLD_EXPRESSION && count <= MAX_BOLD_EXPRESSION) return 5;
    if (count === 6) return 4;
    if (count === 7) return 3;
    if (count === 8) return 2;
    if (count === 9 || count === 10) return 1;
    return 0; // Pour count < 1 ou count > 10
  };

  // Fonction principale
  const analyzeAndReportBoldElements = () => {
    console.log("----------------------------- Start Check strong & bold validity --------------------------------------------");

    // Collecte et traitement des éléments en gras
    const allBoldElements = collectBoldElements();
    const uniqueBoldElements = filterUniqueBoldElements(allBoldElements);

    // Mise à jour de l'objet dataChecker
    dataChecker.bold_check.bold_txt = [];
    dataChecker.bold_check.bold_check_state = uniqueBoldElements.length > 0;

    const isBoldValid = uniqueBoldElements.length >= MIN_BOLD_EXPRESSION &&
      uniqueBoldElements.length <= MAX_BOLD_EXPRESSION;

    // Affichage du résultat
    if (!isBoldValid) {
      console.log(
        `%c Attention le nombre d'éléments mis en gras ne respecte pas le standard (${MIN_BOLD_EXPRESSION} à ${MAX_BOLD_EXPRESSION} expressions), ici >>> ${uniqueBoldElements.length}`,
        "color:red"
      );
    } else {
      console.log(
        `%c Le nombre d'éléments mis en gras respecte le standard (${MIN_BOLD_EXPRESSION} à ${MAX_BOLD_EXPRESSION} expressions), ici >>> ${uniqueBoldElements.length}`,
        "color:green"
      );
    }

    console.log(uniqueBoldElements);

    // Mise à jour des données pour chaque élément en gras
    uniqueBoldElements.forEach(element => {
      dataChecker.bold_check.bold_txt.push({
        bold_txt_state: true,
        bold_txt: element.text,
        bold_nb_words: element.nbWords
      });
    });

    // Mise à jour du nombre total d'éléments en gras
    dataChecker.bold_check.nb_bold = uniqueBoldElements.length;

    // Calcul du score global
    const score = calculateBoldScore(uniqueBoldElements.length);
    dataChecker.bold_check.global_score = score;

    console.log({ "Nombre d'éléments en gras": uniqueBoldElements.length }, { "Score": score });
    console.log("----------------------------- End Check strong & bold validity --------------------------------------------");

    return {
      elements: uniqueBoldElements,
      score: score,
      isValid: isBoldValid
    };
  };

  // Exécution de l'analyse
  analyzeAndReportBoldElements();

})(jQuery);