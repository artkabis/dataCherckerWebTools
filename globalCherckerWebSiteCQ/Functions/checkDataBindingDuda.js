(($) => {
  if ($("#dm").length) {
    let arrayDataBind = [];
    $(
      'a[data-binding*="3"], div[data-binding*="3"], div[new-inline-bind-applied*="true"]'
    ).each((i, t) => {
      arrayDataBind.push({
        type_bind: t.getAttribute("data-element-type"),
        contentBind:
          t.getAttribute("data-element-type") === "social_hub"
            ? t?.querySelector("a")?.getAttribute("href")
            : t.innerText,
      });
    });

    console.log(
      "----------------------------- Start Check databinding content --------------------------------------------"
    );
    console.table(arrayDataBind);
    arrayDataBind.length < 3 &&
      console.log(
        "%cAttention il semble que les éléments devant être databindés ne le sont pas.",
        "color:red"
      );

    console.log(
      "----------------------------- End Check databinding content --------------------------------------------"
    );
  }
})(jQuery);
