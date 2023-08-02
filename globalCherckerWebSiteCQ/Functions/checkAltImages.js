(($) => {
  console.log(
    "----------------------------- Check ALT images --------------------------------------------"
  );
  let nb_alt_imgs_wrong = 0;
  let scoreTabAltImg = [];
  dataChecker.alt_img_check.alt_img = [];

  $("img, svg").each(function (i, t) {
    const src = $(this).attr("src")
      ? $(this).attr("src")
      : $(this).attr("data-src");
    const filterDomain =
      src &&
      this.tagName !== "svg" &&
      !src.includes("mappy") &&
      !src.includes("cdn.manager.solocal.com") &&
      !src.includes("static.cdn-website");
    if (filterDomain) {
      const alt = $(this).attr("alt");
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
        `%cNO ALT SVG >>> ${(this.getAttribute("data-icon-name"), this)}`,
        "color:red"
      );
      nb_alt_imgs_wrong += 1;
      dataChecker.alt_img_check.alt_img.push({
        alt_img_state: true,
        alt_img_src: src ? src : "bgimage",
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