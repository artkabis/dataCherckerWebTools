(() => {
  console.clear();
  console.log(
    "%cSolocal %c - checker tools %cby Greg ;)",
    "color:#0097ff;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold",
    "color:#0097ff;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold",
    "color:#0097ff;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 0.2px black;font-weight:bold"
  );
  const device = "mobile";
  //prompt('Veuillez indiquer le device à tester (mobile ou desktop) : ');
  const apiCall = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${window.location.href}&strategy=${device}&category=pwa&category=seo&category=performance&category=accessibility`;
  fetch(apiCall)
    .then((response) => response.json())
    .then((json) => {
      const lighthouse = json.lighthouseResult;
      const isStackPack = lighthouse?.stackPacks;
      const stack = isStackPack ? lighthouse?.stackPacks[0]?.title : undefined;
      console.log(lighthouse);
      const lighthouseMetrics = {
        "Testing device": device,
        stack,
        "First Contentful Paint":
          lighthouse?.audits["first-contentful-paint"]?.displayValue,
        "largest-contentful-paint":
          lighthouse?.audits["largest-contentful-paint"]?.displayValue,
        "Speed Index": lighthouse?.audits["speed-index"]?.displayValue,
        "Time To Interactive": lighthouse?.audits["interactive"]?.displayValue,
        "Performance score": lighthouse?.categories["performance"]?.score, //lighthouse?.categories["pwa"]?.score,
        "Image alt ko": lighthouse?.audits["image-alt"]?.details?.items,
      };
      console.log(
        Object.fromEntries(
          Object.entries(lighthouseMetrics).filter(([key, value]) => value)
        )
      );
    });
})();
