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



    /****** Vérification qu'au moins deux h2 sont suivi du h1 ****************** */
    console.log('Vérification des doubles h2 après h1 >>>>')
      // let h1Found = false;
      // let h2Count = 0;
      // const elements = document.querySelectorAll('h1, h2, h3');
      // for (var i = 0; i < elements.length; i++) {
      //   let currentElement = elements[i];
      //   (currentElement.tagName.toLowerCase() === 'h1') ? (h1Found = true, h2Count = 0) // Réinitialiser le compteur h2Count lorsqu'un nouveau h1 est trouvé
      //   : (currentElement.tagName.toLowerCase() === 'h2' && h1Found) ? h2Count++ : '';// Si on trouve un h3 après un h1, réinitialiser le compteur h2Count  
      // }

      // (h1Found && h2Count >= 2) ?
      //   console.log('%cLa structure est valide : votre h1 est bien suivi d\'au moins deux h2.', 'color:green')
      // : (!h1Found) ? console.log('%cErreur : Aucun H1 n\a été trouvé..', 'color:orange') :
      //   console.log('%cAttention : Vous avez un h2 orphelin situé après votre h1 (ils doivent être (au minimum) au nombre de deux).', 'color:orange');
      
// Supposons que vous avez déjà votre structure DOM
const headings = document.querySelectorAll('h1, h2, h3');

let h1Found = false;
let consecutiveH2Count = 0;
let h3Detected = false;
const minimumConsecutiveH2Count = 2; // Modifier selon vos besoins

for (var i = 0; i < headings.length; i++) {
  var currentHeading = headings[i];

  if (i === 0 && currentHeading.tagName.toLowerCase() === 'h1') {
    h1Found = true;
    consecutiveH2Count = 0;
  } else if (!h3Detected && currentHeading.tagName.toLowerCase() === 'h2' && h1Found) {
    consecutiveH2Count++;
  } else {
    // Si on trouve un élément différent de h2, réinitialiser le compteur
    consecutiveH2Count = 0;
    h3Detected = true;
  }

  // Vérifier si la condition est satisfaite
   (h1Found && consecutiveH2Count >= minimumConsecutiveH2Count) && console.log('%cLa structure est valide : votre h1 est bien suivi d\'au moins deux h2.', 'color:green');
}

// Si on ne trouve pas de structure valide, afficher une erreur
 (consecutiveH2Count < minimumConsecutiveH2Count) ? console.log('%cAttention : Vous avez un h2 orphelin (ou absent) situé après votre h1. Ils doivent être (au minimum) au nombre de deux.', 'color:orange') : 
 !h1Found ? console.log('%cErreur : Aucun H1 n\a été trouvé..', 'color:orange') : '';







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
