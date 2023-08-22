(($) => {
  console.log(
    "----------------------------- START check Hn outline validity -----------------------------"
  );
  console.log(" ------------------------------- HnOutlineValidity starting");
  const isHeadingValid = (currentHn, previousHn) => {
    const currentHnIndex = parseInt(currentHn.charAt(1));
    const previousHnIndex = parseInt(previousHn.charAt(1));
    if (currentHn === previousHn) {
      return false;
    }
  
    if (currentHnIndex !== previousHnIndex + 1) {
      return false;
    }
    if(currentHn === "h1" && previousHn) {
      return false
    }
  
    return true;
  };
  const hasDuplicateH1 = () => {
    const h1Tags = document.querySelectorAll("h1");
    const h1Texts = Array.from(h1Tags).map((h1) => h1.textContent.toLowerCase());
    const uniqueH1Texts = new Set(h1Texts);
  
    return h1Texts.length > 1;
  };
  
  
  
  
  let hnTagArray = [],rendu,validStructure=true;
    hnTagContentArray = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (t, i) {
    hnTagArray.push(t.tagName.toLowerCase());
    hnTagContentArray.push(t.textContent);
  });
  
    previousHn = null;
  
  hnTagArray.forEach(function (currentHn, index) {
    const currentHnContent = hnTagContentArray[index];
    const currentHnIndex = parseInt(currentHn.charAt(1));
 
  
    if (index > 0) {
      const isValid = isHeadingValid(currentHn, previousHn);
  
      if (!isValid) {
        const missingHeadingsCount =
          currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);
  
        for (let i = 1; i <= missingHeadingsCount; i++) {
          const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
          const missingHn = `h${missingHnIndex}`;
          const missingHnContent = `Missing Heading - ${missingHn}`;
          rendu += `${currentHn} - ${currentHnContent} - Non valide_`;
          console.log(`%c<${missingHn}> - ${missingHnContent}  !!!!  </${missingHn}>`,'color:red');
          validStructure =false;
        }
      }
      if (currentHn === "h1" && hasDuplicateH1()) {
        rendu += `${currentHn} - ${currentHnContent} - Non valide_`;

       console.log(`%c<${currentHn}> Warning: Duplicate H1 - ${currentHnContent}   </${currentHn}>`,'color:red');
       validStructure = false;
      }      
    }else if (index === 0 && currentHn !== "h1") {
      rendu += `${currentHn} - ${currentHnContent} - Non valide_`;

     console.log(`%c<${currentHn}> Warning: Hn cannot be before H1 - ${currentHnContent}   </${currentHn}>`,'color:red');
     validStructure = false;
    }
    rendu += `${currentHn} - ${currentHnContent} - valide_`;
    console.log(`%c <${currentHn}> - ${currentHnContent} </${currentHn}>`,'color:green');
    previousHn = currentHn;
  });
  
  /*let rendu = "";
  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;
  const h1Indexes = [];

  const verifierStructureHn = (HnArray) => {
    const niveaux = ["h1", "h2", "h3", "h4", "h5", "h6"];
    let hasH1 = false;
    let hasH2 = false;
    let hasH3 = false;
    let validStructure = true;

    for (let i = 0; i < HnArray.length; i++) {
      
      const balise = HnArray[i];
      const niveauActuel = niveaux.indexOf(balise.nodeName.toLowerCase());

      if (balise.nodeName.toLowerCase() === "h1") {
        h1Count++;
        if (!h1Indexes.includes(i)) {
          h1Indexes.push(i);
          if (i === 0) {
            rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide`,
              "color: green"
            );
            hasH1 = true;
          } else if (i === 0 && niveauActuel !== "h1") {
            rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (premier tag doit être h1)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (premier tag doit être h1)`,
              "color: red"
            );
            validStructure = false;
          }
        } else {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (doublon)_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (doublon)`,
            "color: red"
          );
          validStructure = false;
        }

        if (h1Count > 1 && i > 0) {
          if (balise.nodeName.toLowerCase() === "h1") {
            rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (doublon)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (doublon)`,
              "color: red"
            );
            validStructure = false;
          }
        }
      } else if (balise.nodeName.toLowerCase() === "h2") {
        if (!hasH1) {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1 manquant)_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1 manquant)`,
            "color: red"
          );
          validStructure = false;
        } else {
          h2Count++;
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide`,
            "color: green"
          );
          hasH2 = true;
        }
      } else if (balise.nodeName.toLowerCase() === "h3") {
        if (!hasH1 || !hasH2) {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1 ou h2 manquant)_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1 ou h2 manquant)`,
            "color: red"
          );
          validStructure = false;
        } else {
          h3Count++;
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide`,
            "color: green"
          );
          hasH3 = true;
        }
      } else if (balise.nodeName.toLowerCase() === "h4") {
        if (!hasH1 || !hasH2 || !hasH3) {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1, h2 ou h3 manquant)_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide (h1, h2 ou h3 manquant)`,
            "color: red"
          );
          validStructure = false;
        } else {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide`,
            "color: green"
          );
        }
      } else {
        // Vérifier si le niveau actuel est inférieur au niveau précédent ou a des niveaux intermédiaires manquants
        const niveauPrecedent = niveaux.indexOf(
          (i>0) ? HnArray[i - 1].nodeName.toLowerCase() : HnArray[0].nodeName.toLowerCase()
        );
        if (niveauActuel <= niveauPrecedent) {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Non valide`,
            "color: red"
          );
          validStructure = false;
        } else if (niveauActuel - niveauPrecedent > 1) {
          for (let j = niveauPrecedent + 1; j < niveauActuel; j++) {
            rendu += `${niveaux[j]} - ${balise.textContent} - Non valide (niveau manquant)_`;
            console.log(
              `%c${niveaux[j]} - ${balise.textContent} - Non valide (niveau manquant)`,
              "color: red"
            );
            validStructure = false;
          }
        } else {
          rendu += `${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide_`;
          console.log(
            `%c${balise.nodeName.toLowerCase()} - ${balise.textContent} - Valide`,
            "color: green"
          );
        }
      }
    }
*/
    if (validStructure) {
      console.log("Structure des Hn valide.");
    } else {
      console.log("Structure des Hn invalide.");
    }
  const allTagHn = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
  let globalScoreHnReco = [],
    nbHn = 0;
  dataChecker.hn.hn_reco.hn.length = 0;
  allTagHn.forEach((t, i) => {
    nbHn++;
    const nbLetters = t.textContent.length;
    const tagName = t.tagName;
    const tagContent = t.textContent.trim()
      .replaceAll("\n", " ")
      .replaceAll(",", " ")
      .replaceAll("\t", "")
      .replaceAll("'", "’")
      .replaceAll("l'", "")
      .replaceAll("l’", "")
      .replaceAll("t’", "")
      .replaceAll("  ", " ");
    let words = tagContent.split(" ");
    const stopWords = [
      "&",
      "?",
      ":",
      "je",
      "me",
      "m’",
      "moi",
      "tu",
      "te",
      "t’",
      "l'",
      "toi",
      "par",
      "nous",
      "vous",
      "il",
      "de",
      "des",
      "ces",
      "ses",
      "près",
      "pour",
      "vers",
      "selon",
      "vos",
      "et",
      "aux",
      "ou",
      "où",
      "votre",
      "notre",
      "à",
      "a",
      "sur",
      "dans",
      "alentours",
      "elle",
      "ils",
      "elles",
      "se",
      "en",
      "y",
      "le",
      "la",
      "l’",
      "les",
      "lui",
      "soi",
      "leur",
      "eux",
      "lui",
      "leur",
      "celui",
      "celui-ci",
      "celui-là",
      "celle",
      "celle-ci",
      "celle-là",
      "ceux",
      "ceux-ci",
      "ceux-là",
      "celles",
      "celles-ci",
      "celles-là",
      "ce",
      "ceci",
      "cela",
      "ça",
      "le mien",
      "le tien",
      "le sien",
      "la mienne",
      "la tienne",
      "la sienne",
      "les miens",
      "les tiens",
      "les siens",
      "les miennes",
      "les tiennes",
      "les siennes",
      "le nôtre",
      "le vôtre",
      "le leur",
      "la nôtre",
      "la vôtre",
      "la leur",
      "les nôtres",
      "les vôtres",
      "les leurs",
      "qui",
      "que",
      "quoi",
      "dont",
      "où",
      "lequel",
      "auquel",
      "duquel",
      "laquelle",
      "à laquelle",
      "de laquelle",
      "lesquels",
      "auxquels",
      "desquels",
      "lesquelles",
      "auxquelles",
      "desquelles",
      "qui",
      "que",
      "quoi",
      "qu'est-ce",
      "lequel",
      "auquel",
      "duquel",
      "laquelle",
      "à laquelle",
      "de laquelle",
      "lesquels",
      "auxquels",
      "desquels",
      "lesquelles",
      "auxquelles",
      "desquelles",
      "on",
      "tout",
      "un",
      "une",
      "l'un",
      "l'une",
      "les uns",
      "les unes",
      "un autre",
      "une autre",
      "d'autres",
      "l'autre",
      "les autres",
      "aucun",
      "aucune",
      "aucuns",
      "aucunes",
      "certains",
      "certaine",
      "certains",
      "certaines",
      "tel",
      "telle",
      "tels",
      "telles",
      "tout",
      "toute",
      "tous",
      "toutes",
      "le même",
      "la même",
      "les mêmes",
      "nul",
      "nulle",
      "nuls",
      "nulles",
      "quelqu'un",
      "quelqu'une",
      "quelques uns",
      "quelques unes",
      "personne (aucun)",
      "autrui",
      "quiconque",
      "d’aucun",
      "autrui",
      "on",
      "personne",
      "quelque chose",
      "quiconque",
      "rien",
      "chacun",
      "chacune",
      "plusieurs",
      "d’aucuns",
      "Quelles",
      "quelles",
      "quelles",
      "sont",
      "Quels",
      "quels",
      "encore",
      "Encore",
      "Nos",
      "nos",
    ];

    words = words.filter((w) => !stopWords.includes(w.toLowerCase()));
    console.log({
      [tagName]: tagContent,
      " nb lettres": nbLetters,
      "nombre de mots comptabilisés (de 5 à 8) ": Number(words.length),
      "mots comptabilisés": words.join(",").replaceAll("\n", " "),
      node: t,
      index: i,
    });

    if (
      ((tagName === "H1" || tagName === "H2") && nbLetters < 50) ||
      nbLetters > 90
    ) {
      dataChecker.hn.hn_reco.hn.push({
        hn_type: tagName,

        hn_letters_count: nbLetters,

        hn_txt: tagContent,

        hn_index: i,

        hn_words_sliced: words,

        hn_words_count: Number(words.length),

        hn_preco: "Nombre de mots comptabilisés (de 5 à 8)",

        hn_score: 0,
      });
      globalScoreHnReco.push(0);
      console.log(
        "%c" +
          tagName +
          " : " +
          tagContent +
          " ------ Erreur -> nombre de caractères : " +
          nbLetters +
          ", ne rentre pas dans la préco de 50 -> 90 caractères",
        "color:red"
      );
    } else {
      dataChecker.hn.hn_reco.hn.push({
        hn_type: tagName,

        hn_letters_count: nbLetters,

        hn_txt: tagContent,

        hn_index: i,

        hn_words_sliced: words,

        hn_words_count: Number(words.length),

        hn_preco: "Nombre de mots comptabilisés (de 5 à 8)",

        hn_score: 5,
      });
      globalScoreHnReco.push(5);
    }
  });
  console.log('---------------------------------- HnReco',dataChecker.hn.hn_reco.hn);

  //rendu = rendu.replaceAll('"', "").replaceAll("'", "").slice(0, -1);
  const renduTab = rendu.split("_");
  let scoreOutlineHn = [];
  dataChecker.hn.hn_outline.hn = [];
  console.log('-------------------------------- rendu  split : ',{renduTab});
  renduTab.forEach((t, i) => {
    let validity = t.includes("Non valide") ? false : true;
    const score = (validity === false) ? 0 : 5;
    //console.log('t.includes("Non valide") : ',{t}, 'include Non valide : ',t.includes("Non valide"), {score})
    const cleanT = t.replaceAll('undefined','')
    //console.log('    detection score validity strcture heading Hn : ',{cleanT}, {validity}, {score});
    dataChecker.hn.hn_outline.hn.push({
      hn_type: t.split(" - ")[0],
      hn_validity: validity,
      hn_validity_message: t.split(" - ")[1],
      hn_validity_score: score,
    });
    scoreOutlineHn.push(score);
  });
  const hasZeroInOutlineHn = (array) => {
    return array.filter((value) => {
      return value === 0;
    }).length === 0 ? 5 : 0;
  };
  const scoreHnOutline = hasZeroInOutlineHn(scoreOutlineHn)
  const scoreHnReco =
    globalScoreHnReco.length > 1
      ? Number(
          (
            globalScoreHnReco.reduce((a, b) => a + b) / globalScoreHnReco.length
          ).toFixed(2)
        )
      : globalScoreHnReco[0];
  dataChecker.hn.hn_reco.hn_check_state = true;
  dataChecker.hn.hn_reco.global_score = scoreHnReco;
  dataChecker.hn.hn_outline.global_score = scoreHnOutline;
  dataChecker.hn.hn_check_state = true;
  dataChecker.hn.global_score = Number(
    ((scoreHnReco + scoreHnOutline) / 2).toFixed(2)
  );

  dataChecker.hn.nb_hn = nbHn;
  console.log(
    "----------------------------- END check Hn outline validity -----------------------------"
  );


  /*** checker outline Hn fonctionnel
   * 
   * 
   * 
   * 
   * console.log(" ------------------------------- HnOutlineValidity starting");

const isHeadingValid = (currentHn, previousHn) => {
  const currentHnIndex = parseInt(currentHn.charAt(1));
  const previousHnIndex = parseInt(previousHn.charAt(1));

  if (currentHn === previousHn) {
    return false;
  }

  if (currentHnIndex !== previousHnIndex + 1) {
    return false;
  }

  return true;
};

const hasDuplicateH1 = () => {
  const h1Tags = document.querySelectorAll("h1");
  const h1Texts = Array.from(h1Tags).map((h1) => h1.textContent.toLowerCase());
  const uniqueH1Texts = new Set(h1Texts);

  return h1Texts.length !== uniqueH1Texts.size;
};

const getHeadingStyle = (isValid, currentHnIndex, parentStyle) => {
  const backgroundColor = isValid ? parentStyle.backgroundColor : "orange";
  const margin = currentHnIndex * 50;

  return `margin-left: ${margin}px; color: green; display: flex; align-items: center; background-color: ${backgroundColor};`;
};

const getSpanStyle = (parentStyle, isValid, isMissingHeading) => {
  let backgroundColor = isMissingHeading ? "orange" : isValid ? "green" : "green";
  return `color: white; background: ${backgroundColor}; text-transform: uppercase; padding: 5px 20px;`;
};

let hnTagArray = [],
  hnTagContentArray = [];
document
  .querySelectorAll("h1, h2, h3, h4, h5, h6")
  .forEach(function (t, i) {
    hnTagArray.push(t.tagName.toLowerCase());
    hnTagContentArray.push(t.textContent);
  });

let previousHn = null;
let messageValidity = "";
let isHierarchyValid = true;

hnTagArray.forEach(function (currentHn, index) {
  const currentHnContent = hnTagContentArray[index];
  const currentHnIndex = parseInt(currentHn.charAt(1));
  const parentStyle = window.getComputedStyle(document.querySelector(currentHn));

  if (index > 0) {
    const isValid = isHeadingValid(currentHn, previousHn);

    if (!isValid) {
      const missingHeadingsCount = currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);

      for (let i = 1; i <= missingHeadingsCount; i++) {
        const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
        const missingHn = `h${missingHnIndex}`;
        const missingHnContent = `Missing Heading - ${missingHn}`;
        const missingHeadingStyle = getHeadingStyle(false, missingHnIndex, parentStyle);
        messageValidity = `Heading ${missingHn} is missing between ${previousHn} and ${currentHn}`;
        console.log(`%c ${messageValidity}`, 'color: red');
      }

      isHierarchyValid = false; // Marquer la hiérarchie comme invalide
    }

    if (currentHn === "h1" && hasDuplicateH1()) {
      messageValidity = `Warning: Duplicate H1 - ${currentHnContent}`;
      console.log(`%c ${messageValidity}`, 'color: red');
      isHierarchyValid = false; 
    }
  }

  messageValidity = `Valid: ${currentHn} - ${currentHnContent}`;
  console.log(`%c ${messageValidity}`, 'color: green');

  previousHn = currentHn;
});

// Calcul de la note sur 5 en fonction de la validité de la hiérarchie
const maxScore = 5;
const finalScore = isHierarchyValid ? maxScore : 0;
console.log(`%c Global Score: ${finalScore}/5`, `color: ${finalScore === maxScore ? 'green' : 'red'}`);

   * 
   * 
   */
})(jQuery);
