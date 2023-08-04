(($) => {
  let arrayDataBind = [];
  $('a[data-binding*="3"], div[data-binding*="3"]').each((i, t) => {
    arrayDataBind.push({
      type_bind: t.getAttribute("data-element-type"),
      contentBind: t.innerText,
    });
  });

  console.log(
    "----------------------------- Start Check databinding content --------------------------------------------"
  );
  console.log(arrayDataBind);

  console.log(
    "----------------------------- End Check databinding content --------------------------------------------"
  );
})(jQuery);
