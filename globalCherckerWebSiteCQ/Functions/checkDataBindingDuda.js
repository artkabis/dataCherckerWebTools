(($) => {
  if($('#dm').length){
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
  (arrayDataBind.length<1)&&console.log('%cAttention il semble que les éléments devant être databing ne sont pas présent.','color:red');

  console.log(
    "----------------------------- End Check databinding content --------------------------------------------"
  );
}
})(jQuery);
