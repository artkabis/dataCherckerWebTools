(($) => {
  //Start meta check
  const title = $('meta[property="og:title"]').attr("content");
  const desc = $('meta[name="description"]').attr("content");
  dataChecker.hn.hn_reco.hn = [];
  let titleLength,
    checkTitle,
    recoTitle = " Entre 50 et 60 caractères.",
    checkValideTitle,
    scoreTitle;
  if (title) {
    titleLength = title.length ? title.length : 0;
    checkTitle = titleLength > 0;

    checkValideTitle = titleLength >= 50 && titleLength <= 65 ? true : false;
    scoreTitle = checkValideTitle ? 2.5 : 0;

    //data title
    dataChecker.meta_check.meta[0].meta_state =
      title && titleLength ? true : false;
    dataChecker.meta_check.meta[0].meta_txt = checkTitle && title;
    dataChecker.meta_check.meta[0].meta_size = checkTitle && titleLength;
    dataChecker.meta_check.meta[0].meta_reco = recoTitle;
    dataChecker.meta_check.meta[0].meta_score = scoreTitle;
  } else {
    dataChecker.meta_check.meta[0].meta_state =
      title && titleLength ? true : false;
    dataChecker.meta_check.meta[0].meta_txt = checkTitle && title;
    dataChecker.meta_check.meta[0].meta_size = checkTitle && titleLength;
    dataChecker.meta_check.meta[0].meta_reco = recoTitle;
    dataChecker.meta_check.meta[0].meta_score = 0;
    scoreTitle = 0;
  }

  // desc
  const recoDesc = " Entre 140 et 156 caractères.";
  let scoreDesc = 0,
    checkDesc,
    descLength = 0,
    checkValideDesc = false;
  if (desc) {
    descLength = desc.length;
    checkDesc = descLength > 0;

    checkValideDesc = descLength >= 140 && descLength <= 156 ? true : false;
    scoreDesc = checkValideDesc ? 2.5 : 0;

    //data desc
    dataChecker.meta_check.meta[1].meta_state =
      desc && descLength ? true : false;
    dataChecker.meta_check.meta[1].meta_txt = checkDesc && desc;
    dataChecker.meta_check.meta[1].meta_size = checkDesc && descLength;
    dataChecker.meta_check.meta[1].meta_reco = recoDesc;
    dataChecker.meta_check.meta[1].meta_score = scoreDesc;
  } else {
    dataChecker.meta_check.meta[1].meta_state =
      desc && descLength ? true : false;
    dataChecker.meta_check.meta[1].meta_txt = "Aucune meta description";
    dataChecker.meta_check.meta[1].meta_size = "0";
    dataChecker.meta_check.meta[1].meta_reco = recoDesc;
    dataChecker.meta_check.meta[1].meta_score = 0;
    scoreDesc = 0;
  }

  //Data global meta
  dataChecker.meta_check.global_score =
    scoreTitle === 0 && scoreDesc === 0
      ? 0
      : Number((scoreTitle + scoreDesc).toFixed(2));
  dataChecker.meta_check.meta_check_state =
    checkTitle && checkDesc ? true : false;
  let nbMeta = 0;
  if (desc && title) {
    nbMeta = checkDesc && checkTitle && 2;
  } else if (!title && !desc) {
    nbMeta = 0;
  } else {
    nbMeta = 1;
  }
  dataChecker.meta_check.nb_meta = nbMeta;

  console.log(
    "----------------------------- Check META --------------------------------------------"
  );
  title && checkTitle
    ? console.log(
        `%c Meta title : ${title} -> caractère : ${titleLength} ----- (de 50 à 65)`,
        `color:${checkValideTitle ? "green" : "red"}`
      )
    : console.log(`%c Meta title non présente !!!`, `color:red`);
  desc && desc.length > 0
    ? console.log(
        `%c Meta description : ${desc} -> caractère : ${descLength} ----- (de 140 à 156)`,
        `color:${checkValideDesc ? "green" : "red"}`
      )
    : console.log(`%c Meta desc non présente !!!`, `color:red`);
  console.log(
    "----------------------------- END Check META --------------------------------------------"
  );
})(jQuery);
