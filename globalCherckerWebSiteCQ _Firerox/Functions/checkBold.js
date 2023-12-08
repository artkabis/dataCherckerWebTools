(($) => {
  const isBold = (el) =>
    el.attr("style") && 
    (el.attr("style").includes("font-weight: bold") ||
    el.attr("style").includes("font-weight: 700") ||
    el.attr("style").includes("font-weight: 600") ||
    el.attr("style").includes("font-weight: 700") ||
    el.attr("style").includes("font-weight: 800") ||
    el.attr("style").includes("font-weight: 900") &&
    el[0].textContent.trim().length);
    
    const isMultiSpan = (el) =>isBold(el) &&isBold(el.children()) && el[0].textContent.trim().length ? true : false;


    const isHnClosest = (el) =>
    el[0].tagName.toLowerCase() === "h1" ||
    el.parents("h1").length ||
    el[0].tagName.toLowerCase() === "h2" ||
    el.parents("h2").length ||
    el[0].tagName.toLowerCase() === "h3" ||
    el.parents("h3").length ||
    el[0].tagName.toLowerCase() === "h4" ||
    el.parents("h4").length ||
    el[0].tagName.toLowerCase() === "h5" ||
    el.parents("h5").length ||
    el[0].tagName.toLowerCase() === "h6" ||
    el.parents("h6").length;
    
    const isHnLink = (el) =>
    el[0].tagName.toLowerCase() === "a" ||
    el.parent()[0].tagName.toLowerCase() === "a";
  

  const strongOrBold = $(
    "b, strong, STRONG, B"
  );
  strongOrBold &&
    console.log(
      "----------------------------- Start Check strong & bold valitidy --------------------------------------------"
    );
  let cmpBold = 0,
    boldArray = [],
    isSlideDuda = false,
    isWP = $('#Content').length;
    isDuda = $('#dm').length;
  strongOrBold.each(function (i, t) {
    let strongParent;
    if (isDuda) {
      strongParent = $(this).closest(".dmRespCol") ? $(this).closest(".dmRespCol") : $(this).closest(".dmNewParagraph");
    }else if(isWP && $(this).closest('.wpb_text_column').length){
      strongParent = $(this).closest('.wpb_text_column');
    }else if(isWP && $(this).closest('.wpb_toggle_content').length){ 
      strongParent = $(this).closest('.wpb_toggle_content');
     }else if((!isDuda && !isWP)){
      strongParent = $(this).parent().parent().parent();
     }else{
      strongParent = $(this).parent().parent().parent();
     }

    const nbWordsParent = (strongParent[0]) ? strongParent[0].textContent.trim().split(' ').length : 0;

    testStack = isWP 
    isSlideDuda = (isDuda && $(this).closest(".slide-inner").length) ? true : false;
    isContentDataBinding = (isDuda && ("div[data-binding*='']") && $(this).find("div[data-binding*='']").length) ? true : false;

    if (t.textContent.length > 1 && t.textContent !== " " && !isHnClosest($(this)) && !isHnLink($(this)) && nbWordsParent >=20 && !isSlideDuda && !isContentDataBinding) {
        cmpBold++;
        boldArray.push({
          target: t,
          text: t.textContent,
          nbWords: t.textContent.includes(" ")
            ? t.textContent.split(" ").length
            : 1,
          nbWordsParent: nbWordsParent
        });
    }
  });


  $("#dm_content span").each(function (t) {
    const isDuda =$(this).closest('#dm');
    isSlide = $(this).closest(".slide-inner");
    isContentDataBinding = (isDuda && $(this).find("div[data-binding]").length) ? true : false;

    
    let target = isMultiSpan($(this)) ? $(this).children() : $(this);
      const innerMultiSpan = isMultiSpan($(this))
    const duplicateBoldSpan =
    isMultiSpan($(this)) &&
      $(this)[0]
        .textContent.trim()
        .includes($(this).children()[0].textContent.trim());
        innerMultiSpan &&
      !isHnClosest($(this)) &&
      console.log(
        { target },
        "  isBold : ",
        isBold(target),
        { innerMultiSpan },
        { duplicateBoldSpan },
        "   text content",
        target[0].textContent,
        " text length",
        $(this)[0].textContent.trim().length,
        " parent dmpara nb words : ",
        $(this).parents(".dmNewParagraph")
          ? $(this).parents(".dmNewParagraph")[0].textContent.split(" ").length
          : $(this).parent().parent().parent()[0].textContent.split(" ")
      );

      //isBold(target) && console.log(isBold(target),target,target[0].textContent);
    isBold(target) &&
      !isHnClosest($(this)) &&
      !isContentDataBinding &&
      target[0].textContent !== "\n" &&
      target[0].textContent !== "" &&
      target[0].textContent.length > 1 &&
      !duplicateBoldSpan &&
      (boldArray.push({
        target: target[0], // Modification : Ajouter [0] pour obtenir l'élément DOM
        text: target[0].textContent.trim(),
        nbWords: target[0].textContent.trim().split(" ").length,
        nbWordsParent: target.parents(".dmNewParagraph").length
          ? target.parents(".dmNewParagraph")[0].textContent.split(" ").length
          : target.parent().parent().parent()[0].textContent.split(" "),
      }),
      cmpBold++);
      duplicateBoldSpan && cmpBold--;
      
  });console.log({boldArray});

  // Créer un nouveau tableau pour stocker les éléments uniques
  const objSansDoublons = [];

  // Parcourir l'array initial boldArray
  $.each(boldArray,function(i,t){
    const $isMultiSpan = isMultiSpan($(this));
    const element = boldArray[i];
    const { target, text, nbWords, nbWordsParent } = element;
    // Vérifier si les propriétés "text" et "nbWords" sont identiques
    const isDuplicate = objSansDoublons.some(
      (item) => item.text === text && item.nbWords === nbWords
    );

    if (
       text.length > 2 &&
       !target.closest(".slide-inner") &&
       !target.closest("#Footer") &&
      nbWordsParent >= 25
    ) {
      !$isMultiSpan && objSansDoublons.push({
        target,
        texte_duplique: isDuplicate,
        text,
        nbWords,
        nbWordsParent,
      });
    }
  });
  console.log({objSansDoublons})
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
  } else if (nbBold === 1) {
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
    scroreBold = 1;
  } else if (nbBold === 10) {
    scroreBold = 1;
  } else if (nbBold < 1 && nbBold > 10) {
    scroreBold = 0;
  } else if (nbBold >= 3 && nbBold <= 5) {
    scroreBold = 5;
  }
  dataChecker.bold_check.global_score = scroreBold ? scroreBold : 0;
  console.log({ nbBold }, { scroreBold });
  cmpBold > 0 &&
    console.log(
      "----------------------------- End Check strong & bold valitidy --------------------------------------------"
    );
})(jQuery);
