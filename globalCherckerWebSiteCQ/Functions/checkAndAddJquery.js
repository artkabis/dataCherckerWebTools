notJquery = typeof jQuery == "undefined";
function addJquery() {
  console.log("jQuery n'est pas installé, lancement de cette librairie ...");
  //Script permettant de charger jQuery est de l'utiliser ensuite dans votre projet.
  const loadScript = async (url) => {
    const response = await fetch(url);
    const script = await response.text();
    console.log(script);
    eval(script);
  };
  const scriptUrl =
    "//cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
  loadScript(scriptUrl);
}
notJquery && addJquery();