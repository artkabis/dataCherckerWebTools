//Add globale score in dataChecker
cmp = 0;
initDataChecker = (size_scores, ratio_scores, alt_scores, scoreCheckLink) => {
  cmp++;
  if (cmp === 1) {
    console.log("initDataChecker started");

    const globalSizeScore = Number(
      size_scores.length > 0
        ? (size_scores.reduce((a, b) => a + b) / size_scores.length).toFixed(2)
        : 5
    );
    global_size_scores = globalSizeScore ? globalSizeScore : 5;
    global_ratio_scores =
      size_scores.length > 0
        ? Number(
          (
            ratio_scores.reduce((a, b) => a + b) / ratio_scores.length
          ).toFixed(2)
        )
        : 5;
    let altScore = [];
    dataChecker.img_check.alt_img.forEach((t, i) =>
      altScore.push(t.alt_img_score)
    );
    const global_alt_scores =
      alt_scores.length > 0
        ? Number(
          (altScore.reduce((a, b) => a + b) / altScore.length).toFixed(2)
        )
        : 5;
    dataChecker.alt_img_check.global_score = global_alt_scores;

    console.log(
      { global_ratio_scores },
      { global_size_scores },
      { global_alt_scores }
    );

    dataChecker.img_check.global_score = Number(
      (
        (global_ratio_scores + global_size_scores + global_alt_scores) /
        3
      ).toFixed(2)
    );
    dataChecker.img_check.img_check_state = true;
    dataChecker.img_check.global_ratio_scores = global_ratio_scores;
    dataChecker.img_check.global_size_scores = global_size_scores;
    dataChecker.img_check.global_alt_scores = global_alt_scores;

    // Collecter tous les scores globaux pour le calcul final
    const scores = [
      Number(global_alt_scores),
      Number(dataChecker.hn.global_score),
      Number(dataChecker.meta_check.global_score),
      Number(dataChecker.img_check.global_score),
      Number(dataChecker.link_check.global_score),
      Number(dataChecker.bold_check.global_score)
    ];

    // Ajouter le score de contraste s'il existe
    if (dataChecker.contrast_check && typeof dataChecker.contrast_check.global_score === 'number') {
      scores.push(Number(dataChecker.contrast_check.global_score));
      console.log("Score de contraste ajouté au calcul global:", dataChecker.contrast_check.global_score);
    }

    //Calculate global scores
    dataChecker.link_check.global_score = scoreCheckLink.length
      ? Number(
        (
          scoreCheckLink.reduce((a, b) => a + b) / scoreCheckLink.length
        ).toFixed(2)
      )
      : 5;
    const globalScore = Number(
      (
        Number(
          global_alt_scores +
          dataChecker.hn.global_score +
          dataChecker.meta_check.global_score +
          dataChecker.img_check.global_score +
          dataChecker.link_check.global_score +
          dataChecker.bold_check.global_score
        ) / 6
      ).toFixed(2)
    );
    dataChecker.global_score = globalScore;
    dataChecker.cdp_global_score.scores = [];
    dataChecker.webdesigner_global_score.scores = [];
    let globalScoreWeb = [],
      globalScoreCDP = [];
    function deepSearchByKey(object, originalKey, matches = []) {
      if (object != null) {
        if (Array.isArray(object)) {
          for (let arrayItem of object) {
            deepSearchByKey(arrayItem, originalKey, matches);
          }
        } else if (typeof object == "object") {
          for (let key of Object.keys(object)) {
            if (key == originalKey) {
              matches.push(object);
            } else {
              deepSearchByKey(object[key], originalKey, matches);
            }
          }
        }
      }
      return matches;
    }
    const allDataProfil = deepSearchByKey(dataChecker, "profil");
    const CDPData = allDataProfil.filter((t) => {
      return t.profil.includes("CDP");
    });
    const WebData = allDataProfil.filter((t) => {
      return t.profil.includes("WEBDESIGNER");
    });

    const filteredDataCDP = CDPData.reduce((acc, item) => {
      acc[item.check_title] = item.global_score;
      globalScoreCDP.push(item.global_score);
      return acc;
    }, {});

    const filteredDataWebdesigner = WebData.reduce((acc, item) => {
      acc[item.check_title] = item.global_score;
      globalScoreWeb.push(item.global_score);
      return acc;
    }, {});

    dataChecker.cdp_global_score.scores = filteredDataCDP;

    dataChecker.webdesigner_global_score.scores = filteredDataWebdesigner;

    const globalScoreWebTotal = Number(
      (globalScoreWeb.reduce((a, b) => a + b) / globalScoreWeb.length).toFixed(
        2
      )
    );
    console.log({ WebData }, { CDPData });
    const globalScoreCDPTotal = Number(
      (globalScoreCDP.reduce((a, b) => a + b) / globalScoreCDP.length).toFixed(
        2
      )
    );
    dataChecker.webdesigner_global_score.global_score = globalScoreWebTotal;
    dataChecker.cdp_global_score.global_score = globalScoreCDPTotal;

    dataChecker.state_check = true;
    console.log({ dataChecker });
    chrome.runtime.sendMessage({
      action: "open_interface",
      data: JSON.stringify(dataChecker),
    });
    //chrome.storage.sync.set({ openInterface: JSON.stringify(dataChecker) });
    console.log(
      "%c--------------------------------------------Fin du traitement globale du checkerImages ----------------------------------------------------------------",
      "color:green"
    );
  }
};
