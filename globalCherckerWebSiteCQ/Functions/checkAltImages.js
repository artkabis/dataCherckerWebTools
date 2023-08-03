
(($) => {
    async function getImageAsBase64(imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          return base64Data;
        } catch (error) {
          console.error('Erreur lors de la conversion de l\'image en base64 :', error);
          return null;
        }
      }
  console.log(
    "----------------------------- Check ALT images --------------------------------------------"
  );
  let nb_alt_imgs_wrong = 0;
  let scoreTabAltImg = [];
  dataChecker.alt_img_check.alt_img = [];
    let isWP = $('#Content').length;
  $("img, svg").each(function (i, t) {

    let src = $(this).attr("src")
      ? $(this).attr("src")
      : $(this).attr("data-src");
      src = ( src && src.at(0) === "/") ? window.location.origin + src : src;
      let alt;
    const filterDomain =
      src &&
      this.tagName !== "svg" &&
      !src.includes("mappy") &&
      !src.includes("cdn.manager.solocal.com") &&
      !src.includes("static.cdn-website");
    if (filterDomain) {
      alt = $(this).attr("alt");
      !alt && alt === ""
        ? (console.log(`%cNO ALT >>> ${src}`, "color:red"),
          (nb_alt_imgs_wrong += 1),
          dataChecker.alt_img_check.alt_img.push({
            alt_img_state: true,
            alt_img_src: src ? src : $(this).attr("src"),
            alt_img_text: "ALT non valide.",
            alt_img_score: 0,
          }),
          scoreTabAltImg.push(0))
        : dataChecker.alt_img_check.alt_img.push(
            {
              alt_img_state: true,
              alt_img_src: src
                ? src
                : $(this)
                    .attr("background-image")
                    .split("url(")[1]
                    .split(")")[0],
              alt_img_text: alt,
              alt_img_score: 5,
            },
            scoreTabAltImg.push(5)
          );
    } else if (
      this.tagName == "svg" &&
      this.getAttribute("alt") &&
      this.getAttribute("alt").length < 1
    ) {
      console.log(
        `%cNO ALT SVG >>> ${(this.getAttribute("alt"), this)}`,
        "color:red"
      );
      nb_alt_imgs_wrong += 1;
      dataChecker.alt_img_check.alt_img.push({
        alt_img_state: true,
        alt_img_src: src && src ,
        alt_img_text: alt,
        alt_img_score: 0,
      });
      scoreTabAltImg.push(0);
    } else if (
      this.tagName == "svg" &&
      this.getAttribute("alt") &&
      this.getAttribute("alt").length > 2
    ) {
      dataChecker.alt_img_check.alt_img.push({
        alt_img_state: true,
        alt_img_src: src ? src : $(this).attr("class"),
        alt_img_text: this.getAttribute("alt"),
        alt_img_score: 5,
      });
      scoreTabAltImg.push(0);
    }
    (this.tagName !== "svg" && src && !src.includes('mappy')) ? getImageAsBase64(src)
    .then((base64Data) => {
      if (base64Data) {
        console.log(`%c   %c${new URL(src).href}  %c${alt ? alt : 'ALT MANQUANT'}`,
        `background-image:url("${base64Data}");background-size:contain;background-repeat: no-repeat;padding:50px;height:50pxwidth:50px`,
        'color:white',
        `${alt ? "color:green" : "color:red"}`,
        );
        
      } else {
        console.log('Erreur lors de la conversion de l\'image en base64.');
      }
    }): (this.tagName === "svg")&&console.log(`%cFichier SVG :  %c${(!this.getAttribute("alt")) ? this.getAttribute("data-icon-name") : this.getAttribute("alt")}`,'color:white;',
    'color:green');
  });
  dataChecker.alt_img_check.alt_img_check_state = true;
  dataChecker.alt_img_check.nb_alt_img =
    dataChecker.alt_img_check.alt_img.length;
  dataChecker.alt_img_check.alt_img = dataChecker.alt_img_check.alt_img.filter(
    (element) => Object.keys(element).length > 1
  );
  console.log(
    "______________________alt img : ",
    dataChecker.alt_img_check.alt_img
  );

  dataChecker.alt_img_check.global_score = Number(
    scoreTabAltImg.reduce((a, b) => a + b) / scoreTabAltImg.length
  ).toFixed(2);

  console.log(
    "----------------------------- END Check ALT images --------------------------------------------"
  );
})(jQuery);