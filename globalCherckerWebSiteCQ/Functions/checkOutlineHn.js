(($) => {

  const settingWords={};
  settingWords.exclusesWords = [
    ":",
    "?",
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
    "d’aucun",
    "d’aucuns",
    "d'autres",
    "d'un",
    "dans",
    "de",
    "de laquelle",
    "depuis",
    "des",
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
  
  
  
  
  let hnTagArray = [],rendu="",validStructure=true;
    hnTagContentArray = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (t, i) {
    hnTagArray.push(t.tagName.toLowerCase());
    hnTagContentArray.push(t.textContent);
  });
  
    previousHn = null;
  
  hnTagArray.forEach(function (currentHn, index) {
    const currentHnContent = hnTagContentArray[index].replaceAll('\n','').replaceAll('<br>','').replaceAll('<BR>','');
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
          rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;
          console.log(`%c<${missingHn}> - ${missingHnContent}  !!!!  </${missingHn}>`,'color:red');
          validStructure =false;
        }
      }
      if (currentHn === "h1" && hasDuplicateH1()) {
        rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;

       console.log(`%c<${currentHn}> Warning: Duplicate H1 -- ${currentHnContent}   </${currentHn}>`,'color:red');
       validStructure = false;
      }      
    }else if (index === 0 && currentHn !== "h1") {
      rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;

     console.log(`%c<${currentHn}> Warning: Hn cannot be before H1 -- ${currentHnContent}   </${currentHn}>`,'color:red');
     validStructure = false;
    }
    rendu += `${currentHn} -- ${currentHnContent} - valide_`;
    console.log(`%c <${currentHn}> - ${currentHnContent} </${currentHn}>`,'color:green');
    previousHn = currentHn;
  });

 
    if (validStructure) {
      console.log("Structure des Hn valide.");
    } else {
      console.log("Structure des Hn invalide.");
    }

  /*************************************** Gestion des precos liée à la longueur de Hn */
  const allTagHn = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
  let globalScoreHnReco = [],
    nbHn = 0;
  dataChecker.hn.hn_reco.hn.length = 0;
  allTagHn.forEach((t, i) => {
    nbHn++;
    const cleanTagContent = t.textContent.trim()
    .replaceAll("\n", " ")
    .replaceAll("\t", "")
    .replaceAll("<br>", "")
    .replace(/\s\s+/g, ' ');
    const tagContent = t.textContent.trim()
      .replaceAll("\n", " ")
      .replaceAll(",", " ")
      .replaceAll("\t", "")
      .replaceAll("'", "’")
      .replaceAll("l'", "")
      .replaceAll("l’", "")
      .replaceAll("t’", "")
      .replaceAll("  ", " ")
      .replace(/\s\s+/g, ' ');
    const nbLetters = cleanTagContent.length;
    const nbLettersNoSpace = cleanTagContent.replace(/\s+/g, '').length;
    const tagName = t.tagName;
    
    let words = tagContent.split(" ");
    const exclusesWords = settingWords.exclusesWords;

    words = words.filter((w) => !exclusesWords.includes(w.toLowerCase()));
    console.log({
      [tagName]: cleanTagContent,
      " nb lettres": nbLetters,
      "nb lettre sans espaces": nbLettersNoSpace,
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

        hn_txt: cleanTagContent,

        hn_index: i,

        hn_words_sliced: words,

        hn_words_count: Number(words.length),

        hn_preco: "Entre 50 et 90 caractères",

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

        hn_txt: cleanTagContent,

        hn_index: i,

        hn_words_sliced: words,

        hn_words_count: Number(words.length),

        hn_preco: "Entre 50 et 90 caractères",

        hn_score: 5,
      });
      globalScoreHnReco.push(5);
    }
  });
  //console.log('---------------------------------- HnReco',dataChecker.hn.hn_reco.hn);

  //rendu = rendu.replaceAll('"', "").replaceAll("'", "").slice(0, -1);
  let renduTab = rendu.split("_");
  let scoreOutlineHn = [];
  dataChecker.hn.hn_outline.hn = [];
  renduTab.forEach((t, i) => {
    if(t.length > 0) {
    let validity = t.includes("Non valide") ? false : true;
    const score = (validity === false) ? 0 : 5;
    //console.log('t.includes("Non valide") : ',{t}, 'include Non valide : ',t.includes("Non valide"), {score})
    const cleanT = t.replaceAll('undefined','')
    //console.log('    detection score validity strcture heading Hn : ',{cleanT}, {validity}, {score});
    dataChecker.hn.hn_outline.hn.push({
      hn_type: t.split(" -- ")[0],
      hn_validity: validity,
      hn_validity_message: t.split(" -- ")[1],
      hn_validity_score: score,
    });
    scoreOutlineHn.push(score);
  }
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
})(jQuery);
