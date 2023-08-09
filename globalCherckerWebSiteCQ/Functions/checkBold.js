(($) => {
  const strongOrBold = $(
    "#Content b, #Content strong, #Content STRONG, #dm_content b, #dm_content B, #dm_content strong, #dm_content STRONG"
  );
  strongOrBold &&
    console.log(
      "----------------------------- Start Check strong & bold valitidy --------------------------------------------"
    );
  let cmpBold = 0,
    boldArray = [],
    isSlide = false;
  strongOrBold.each(function (i, t) {
    const isHnClosest =
      $(this)[0].tagName.toLowerCase() === "h1" ||
      $(this).parent()[0].tagName.toLowerCase() === "h1" ||
      $(this)[0].tagName.toLowerCase() === "h2" ||
      $(this).parent()[0].tagName.toLowerCase() === "h2" ||
      $(this)[0].tagName.toLowerCase() === "h3" ||
      $(this).parent()[0].tagName.toLowerCase() === "h3" ||
      $(this)[0].tagName.toLowerCase() === "h4" ||
      $(this).parent()[0].tagName.toLowerCase() === "h4" ||
      $(this)[0].tagName.toLowerCase() === "h5" ||
      $(this).parent()[0].tagName.toLowerCase() === "h5" ||
      $(this)[0].tagName.toLowerCase() === "h6" ||
      $(this).parent()[0].tagName.toLowerCase() === "h6";
    isSlide = $(this).closest(".slide-inner");
    if (t.textContent.length > 1 && t.textContent !== " ") {
      if (!isHnClosest || !isSlide) {
        cmpBold++;
        boldArray.push({
          target: t,
          text: t.textContent,
          nbWords: t.textContent.includes(" ")
            ? t.textContent.split(" ").length
            : 1,
        });
      }
    }
  });
  $("#dm_content span").each(function (t) {
    isSlide = $(this).closest(".slide-inner");
    const isBold = (el) =>
      el.attr("style") &&
      (el.attr("style").includes("font-weight: bold") ||
        (el.attr("style").includes("font-weight: 700") &&
          $(this)[0].textContent.trim().length));
    const isMultiSpan =
      isBold($(this)) &&
      isBold($(this).children()) &&
      $(this)[0].textContent.trim().length
        ? true
        : false;
    let target = isMultiSpan ? $(this).children() : $(this);
    const isHnClosest =
      target[0].tagName.toLowerCase() === "h1" ||
      target.parent()[0].tagName.toLowerCase() === "h1" ||
      target[0].tagName.toLowerCase() === "h3" ||
      target.parent()[0].tagName.toLowerCase() === "h3" ||
      target[0].tagName.toLowerCase() === "h2" ||
      target.parent()[0].tagName.toLowerCase() === "h2" ||
      target[0].tagName.toLowerCase() === "h4" ||
      target.parent()[0].tagName.toLowerCase() === "h4" ||
      target[0].tagName.toLowerCase() === "h5" ||
      target.parent()[0].tagName.toLowerCase() === "h5" ||
      target[0].tagName.toLowerCase() === "h6" ||
      target.parent()[0].tagName.toLowerCase() === "h6";
    const duplicateBold =
      isMultiSpan &&
      $(this)[0]
        .textContent.trim()
        .includes($(this).children()[0].textContent.trim());
    isMultiSpan &&
      !isHnClosest &&
      console.log(
        { target },
        "  isBold : ",
        isBold(target),
        { isMultiSpan },
        { duplicateBold },
        "   text content",
        target[0].textContent,
        " text length",
        $(this)[0].textContent.trim().length
      );
    isBold(target) &&
      !isHnClosest &&
      target[0].textContent !== "\n" &&
      target[0].textContent !== "" &&
      target[0].textContent.length > 1 &&
      (boldArray.push({
        target: target[0], // Modification : Ajouter [0] pour obtenir l'élément DOM
        text: target[0].textContent.trim(),
        nbWords: target[0].textContent.trim().split(" ").length,
      }),
      cmpBold++);
    duplicateBold && cmpBold--;
  });

  // Créer un nouvel tableau pour stocker les éléments uniques
  const objSansDoublons = [];

  // Parcourir l'array initial boldArray
  for (let i = 0; i < boldArray.length; i++) {
    const element = boldArray[i];
    const { target, text, nbWords } = element;
    // Vérifier si les propriétés "text" et "nbWords" sont identiques
    const isDuplicate = objSansDoublons.some(
      (item) => item.text === text && item.nbWords === nbWords
    );
    if (!isDuplicate && text.length > 2 && !target.closest(".slide-inner")) {
      objSansDoublons.push({
        target, // Modification : Ne pas accéder à [0] pour conserver l'élément DOM
        text,
        nbWords,
      });
    }
  }
  dataChecker.bold_check.bold_txt = [];
  dataChecker.bold_check.bold_check_state =
    objSansDoublons.length === 0 || objSansDoublons === undefined
      ? false
      : true;
  // dataChecker.bold_check.bold_check_state;
  const isBoldValid =
    objSansDoublons.length >= 3 && objSansDoublons.length <= 5;
  !isBoldValid
    ? console.log(
        "%c Attention le nombre déléments mis en gras ne respect pas le standard (3 à 5 expressions), ici >>> " +
          objSansDoublons.length,
        "color:red"
      )
    : console.log(
        "%c Le nombre déléments mis en gras respect le standard (3 à 5 expressions), ici >>> " +
          objSansDoublons.length,
        "color:green"
      ),
    console.log(objSansDoublons);

  objSansDoublons.map((t) => {
    dataChecker.bold_check.bold_check_state = true;
    dataChecker.bold_check.bold_txt.push({
      bold_txt_state: true,
      bold_txt: t.text,
      bold_nb_words: t.nbWords,
    });

    dataChecker.bold_check.nb_bold =
      objSansDoublons.length && objSansDoublons.length;
    //(isBoldValid) && objSansDoublons.length ? 5 : 0;
  });

  if (!objSansDoublons || objSansDoublons.length === 0) {
    dataChecker.bold_check.bold_txt = [];
  }
  let scroreBold = 0;
  let nbBold = dataChecker.bold_check.bold_txt.length
    ? dataChecker.bold_check.bold_txt.length
    : 0;
  if (nbBold === 0) {
    scroreBold = 0;
  }else if (nbBold === 1) {
    scroreBold = 1;
  } else if (nbBold === 2) {
    scroreBold = 4;
  } else if (nbBold === 6) {
    scroreBold = 4;
  } else if (nbBold === 7) {
    scroreBold = 3;
  } else if (nbBold === 8) {
    scroreBold = 2;
  } else if (nbBold === 9) {
    scroreBold = 2;
  } else if (nbBold === 10) {
    scroreBold = 1;
  } else if (nbBold < 1 && nbBold > 10) {
    scroreBold = 0;
  }else if (nbBold >= 3 && nbBold <= 5) {
    console.log('____________________________________________ bold ok ')
    scroreBold = 5;
  } 
  dataChecker.bold_check.global_score = scroreBold ? scroreBold : 0;
  console.log({ nbBold }, { scroreBold });
  cmpBold > 0 &&
    console.log(
      "----------------------------- End Check strong & bold valitidy --------------------------------------------"
    );
})(jQuery);
