console.clear();
console.log(
  "%cWebsite health Checker %c - %cby Artkabis ;)",
  "color:#0097ff;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold",
  "color:#0097ff;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold",
  "color:#0097ff;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 0.2px black;font-weight:bold"
);

const titleTxt = $('meta[property="og:title"]').attr("content") || $('head title').text();
$('meta[property="og:title"], head title').text('⟳ ' + titleTxt);