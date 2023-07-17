export const checkAltImages = () =>{
  console.log(
    "----------------------------- Check ALT images --------------------------------------------"
  );
  $("img, svg").each(function (i, t) {
    const src = $(this).attr("src")
      ? $(this).attr("src")
      : $(this).attr("data-src");
    if (
      src &&
      this.tagName !== "svg" &&
      !src.includes("mappy") &&
      !src.includes("cdn.manager.solocal.com")
    ) {
      const alt = $(this).attr("alt");
      $(this).attr("data-src") &&
        $(this).attr("src", $(this).attr("data-src"));
      !alt &&
        alt === "" &&
        console.log(`%cNO ALT >>> ${this.src}`, "color:red");
    } else if (
      this.tagName == "svg" &&
      this.getAttribute("alt") &&
      this.getAttribute("alt").length < 1
    ) {
      console.log(
        `%cNO ALT SVG >>> ${this.getAttribute("data-icon-name")}`,
        "color:red"
      );
      console.log(this);
    }
  });
  console.log(
    "----------------------------- END Check ALT images --------------------------------------------"
  );
}