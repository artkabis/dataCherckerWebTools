(($) => {
    

    //Counter Hn in hovered
    $(document).on("mouseover", "h1,h2,h3,h4,h5,h6", function () {
      const txt = $(this) ? $(this)[0].innerText : false;
      const txtLength = txt ? txt.trim().length : false;
      const cleanTagContent = $(this)[0].textContent.trim()
    .replaceAll("\n", " ")
    .replaceAll("\t", "")
    .replaceAll("<br>", "")
    .replace(/\s\s+/g, ' ');

    const nbLetters = cleanTagContent.length;
    const nbLettersNoSpace = cleanTagContent.replace(/\s+/g, '').length;
      txtLength &&
        $(this).attr(
          "title",
          $(this)[0].tagName +
            " - Nombre de caractéres : " +
            nbLetters +
            " - Nombre de caractéres sans espaces : " +
            nbLettersNoSpace+
            "\nTexte pris en compte : \n" +
            txt
        );
    });
})(jQuery);