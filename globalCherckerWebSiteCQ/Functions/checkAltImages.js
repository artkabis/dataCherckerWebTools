window.dataCheckerAltAnalysisComplete = true;

(($) => {
  $(".alt_tooltip").length &&
    $(".alt_tooltip").each(function () {
      $(this).remove();
    }); //remove old reference alt_tooltip

  let accessibleImage = false;
  async function getImageAsBase64(imageUrl, validUrl) {
    if (validUrl) {
      try {
        const response = await fetch(imageUrl, { redirect: "manual" });
        const blob = await response.blob();
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        return base64Data;
      } catch (error) {
        console.log(
          "Erreur lors de la conversion de l'image en base64 :",
          imageUrl,
          " ne semble pas disponnible, veuillez vérifier si son url est valide"
        );
        return null;
      }
    }
  }

  const createAltTooltip = (text) =>
    `<span class="alt_tooltip" style="position:relative;top:0;left:0;background:darkred;color:white;padding:5px;margin:5px;height: auto!important;box-shadow: 0 0 5px 0 rgb( 0 0 0 / 80%);width: max-content;display: inline-block !important;font-family: monospace;font-size: 13px !important;line-height: 15px !important;z-index:999999;">${text}</span>`;

  function pushAltImgData(state, src, text, score) {
    dataChecker.alt_img_check.alt_img.push({
      alt_img_state: state,
      alt_img_src: src,
      alt_img_text: text,
      alt_img_score: score,
    });
    scoreTabAltImg.push(score);
  }

  console.log(
    "----------------------------- Check ALT images --------------------------------------------"
  );
  let nb_alt_imgs_wrong = 0;
  let scoreTabAltImg = [];
  dataChecker.alt_img_check.alt_img = [];
  let isWP = $("#Content").length;
  $("img, svg").each(function (i, t) {
    const isSVG = t.tagName === "svg";
    let src = $(this).attr("src")
      ? $(this).attr("src")
      : $(this).attr("data-src");
    const isDudaImage = src && src.includes("cdn-website");

    src =
      !isDudaImage &&
        src &&
        src.at(0).includes("/") &&
        src.includes("/wp-content/")
        ? window.location.origin + "/wp-content/" + src.split("/wp-content/")[1]
        : src && !src.includes("http") && !src.at(0).includes("/")
          ? window.location.origin + "/" + src
          : src;
    let alt;
    const excludes =
      this.getAttribute("class") !== "lb-image" ||
      !$(this).hasClass("leaflet-marker-icon") ||
      $(".accordion-item-arrow svg")?.length;
    src = isSVG ? "no-src-svg" : src;
    const filterDomain =
      src &&
      !src.includes("mappy") &&
      !src.includes("cdn.manager.solocal.com") &&
      !src.includes("static.cdn-website") &&
      !src.includes("sominfraprdstb001.blob.core.windows.net");

    if (filterDomain && excludes && t.tagName !== "svg") {
      alt = $(this).attr("alt");
      if (!alt && (alt === "" || alt === undefined)) {
        nb_alt_imgs_wrong += 1;
        pushAltImgData(
          true,
          src ? src : $(this).attr("src"),
          "ALT non valide.",
          0
        );
        $(this).before(createAltTooltip("!!! ALT MANQUANT !!!"));
      } else {
        pushAltImgData(
          true,
          src
            ? src
            : $(this).attr("background-image").split("url(")[1].split(")")[0],
          alt,
          5
        );
        $(this).before(createAltTooltip(`ALT: "${alt}"`));
      }
    } else if (
      this.tagName == "svg" &&
      (!$(this).find("title").text() ||
        $(this).find("title").text().length === 0) &&
      $(this).attr("class") &&
      !$(this).attr("class").includes("close")
    ) {
      console.log("%cNO ALT SVG >>>", "color:red");
      $(this).before(createAltTooltip("!!! ALT MANQUANT !!!"));
      nb_alt_imgs_wrong += 1;
      pushAltImgData(true, src && src, alt, 0);
    } else if (
      this.tagName == "svg" &&
      $(this).find("title") &&
      $(this).find("title").text().length > 2
    ) {
      pushAltImgData(
        true,
        src ? src : $(this).attr("class"),
        $(this).find("title").text(),
        5
      );
      console.log(
        `%cTitre SVG similaire au alt du tag img : ${$(this).find("title")?.text()?.length > 2
          ? $(this).find("title").text()
          : "ALT MANQUANT"
        }`,
        `${$(this).find("title")?.text()?.length > 2
          ? "color:green"
          : "color:red"
        }`
      );
      $(this).before(createAltTooltip($(this).find("title").text()));
    }

    let validUrl;
    try {
      validUrl = new URL(src).href && true;
    } catch (e) {
      validUrl = false;
    }
    const checkBaseSrc =
      validUrl && src.includes("data:image")
        ? "data:image" + src.split("data:image")[1]
        : src;
    if (
      this.tagName !== "svg" &&
      filterDomain &&
      excludes &&
      validUrl &&
      !src.includes("goo.gl")
    ) {
      getImageAsBase64(checkBaseSrc, validUrl)
        .then((base64Data) => {
          if (base64Data && validUrl) {
            console.log("_____alt to base64 src : ", { checkBaseSrc });
            console.log(
              `%c   %c%o  %c${alt ? alt : "ALT MANQUANT"}`,
              `background-image:url("${base64Data}");background-size:contain;background-repeat: no-repeat;padding:50px;height:50pxwidth:50px`,
              "color:white",
              { href: [new URL(src).href] },
              `${alt ? "color:green" : "color:red"}`
            );
          } else {
            console.log("Erreur lors de la conversion de l'image en base64.");
          }
        })
        .catch((err) => accessibleImage && console.log(err));
    } else if (
      this.tagName === "svg" &&
      filterDomain &&
      excludes &&
      isDudaImage
    ) {
      console.log(
        `%cFichier SVG :  %c${!this.getAttribute("alt")
          ? this.getAttribute("data-icon-name") | $(this).find("title")
          : this.getAttribute("alt")
        }`,
        "color:white;",
        "color:green"
      );
    }
  });

  dataChecker.alt_img_check.alt_img_check_state = true;
  dataChecker.alt_img_check.nb_alt_img =
    dataChecker.alt_img_check.alt_img.length;
  dataChecker.alt_img_check.alt_img = dataChecker.alt_img_check.alt_img.filter(
    (element) => Object.keys(element).length > 1
  );

  let scoreTabAltImg2 = [];
  dataChecker.alt_img_check.alt_img.forEach((t, i) => {
    scoreTabAltImg2.push(
      t?.alt_img_score && String(t?.alt_img_text) !== "undefined" ? 5 : 0
    );
    t.alt_img_score =
      t?.alt_img_score && String(t?.alt_img_text) !== "undefined" ? 5 : 0;
  });

  dataChecker.alt_img_check.global_score = scoreTabAltImg2.length
    ? Number(
      scoreTabAltImg2.reduce((a, b) => a + b) / scoreTabAltImg.length
    ).toFixed(2)
    : 5;

  console.log(
    "notes sur 5 des alt : ",
    scoreTabAltImg,
    "   score moyen des alt :",
    dataChecker.alt_img_check.global_score
  );
  // Déclencher un événement pour signaler l'achèvement
  window.dispatchEvent(new CustomEvent('dataCheckerAltAnalysisComplete'));
  console.log(
    "----------------------------- END Check ALT images --------------------------------------------"
  );
})(jQuery);
