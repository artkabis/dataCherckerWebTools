(($) => {
    

    //Counter Hn in hovered
    $(document).on("mouseover", "h1,h2,h3,h4,h5,h6", function () {
      const txt = $(this) ? $(this)[0].innerText : false;
      const txtLength = txt ? txt.trim().length : false;
      txtLength &&
        $(this).attr(
          "title",
          $(this)[0].tagName +
            " - Nombre de caractéres : " +
            txtLength +
            "\nTexte pris en compte : \n" +
            txt
        );
    });
})(jQuery);