export const copyExpressionsSoprod = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      console.log(
        "executeScriptcopyExpressionsSoprod",
        window.location.origin.includes("soprod")
      );
      (() => {
        if (window.location.origin.includes("soprod")) {
          function e(e) {
            var o = document.createElement("textarea");
            (o.value = e),
              o.setAttribute("readonly", ""),
              (o.style = { position: "absolute", left: "-9999px" }),
              document.body.appendChild(o),
              o.select(),
              document.execCommand("copy"),
              document.body.removeChild(o);
          }
          var o = document.querySelectorAll(
              'div[id^="keywordsContainer"] > div > input'
            ),
            t = "",
            value = "";
          o.forEach(function (e) {
            value =
              e.className.includes("keyword") && e.value != ""
                ? (value += e.value)
                : value + " " + e.value + "\n";
          }),
            e(value),
            alert(value);
        }
      })();
    },
  });
};
