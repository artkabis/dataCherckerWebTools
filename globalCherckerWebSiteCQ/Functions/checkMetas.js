(($) => {
  //Start meta check
  MIN_META_TITLE_CARACTERES = currentSettings.MIN_META_TITLE_CARACTERE || 50;
  MAX_META_TITLE_CARACTERES = currentSettings.MAX_META_TITLE_CARACTERE || 65;
  MIN_META_DESC_CARACTERES = currentSettings.MIN_META_DESC_CARACTERE || 140;
  MAX_META_DESC_CARACTERES = currentSettings.MAX_META_DESC_CARACTERE || 156;

  const title = $('meta[property="og:title"]').attr("content") || $('head title').text();
  const desc = $('meta[name="description"]').attr("content");
  dataChecker.hn.hn_reco.hn = [];
  let titleLength,
    checkTitle,
    recoTitle = ` Entre ${MIN_META_TITLE_CARACTERES} et ${MAX_META_TITLE_CARACTERES} caractères.`,
    checkValideTitle,
    scoreTitle;
  if (title) {
    titleLength = title.length ? title.length : 0;
    checkTitle = titleLength > 0;

    checkValideTitle = titleLength >= MIN_META_TITLE_CARACTERES && titleLength <= MAX_META_TITLE_CARACTERES ? true : false;
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
  const recoDesc = ` Entre ${MIN_META_DESC_CARACTERES} et ${MAX_META_DESC_CARACTERES} caractères.`;
  let scoreDesc = 0,
    checkDesc,
    descLength = 0,
    checkValideDesc = false;
  if (desc) {
    descLength = desc.length;
    checkDesc = descLength > 0;

    checkValideDesc = descLength >= MIN_META_DESC_CARACTERES && descLength <= MAX_META_DESC_CARACTERES ? true : false;
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
      `%c Meta title : ${title} -> caractère : ${titleLength} ----- (de ${MIN_META_TITLE_CARACTERES} à ${MAX_META_TITLE_CARACTERES})`,
      `color:${checkValideTitle ? "green" : "red"}`
    )
    : console.log(`%c Meta title non présente !!!`, `color:red`);
  desc && desc.length > 0
    ? console.log(
      `%c Meta description : ${desc} -> caractère : ${descLength} ----- (de ${MIN_META_DESC_CARACTERES} à ${MAX_META_DESC_CARACTERES})`,
      `color:${checkValideDesc ? "green" : "red"}`
    )
    : console.log(`%c Meta desc non présente !!!`, `color:red`);
  console.log(
    "----------------------------- END Check META --------------------------------------------"
  );
})(jQuery);
