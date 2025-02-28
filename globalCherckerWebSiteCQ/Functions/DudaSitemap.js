export const dudaSitemap = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      if (document.querySelector("#dm")) {
        const menuJson = JSON.parse(
          atob(
            document.head.innerHTML
              .split("NavItems: ")[1]
              .split("',")[0]
              .replaceAll("'", "")
          )
        );
        console.log({ menuJson });
        //menuJson = decodeURIComponent(escape(menuJson));

        const subNavOk = menuJson.filter((t) => t.subNav.length > 0);
        const nv1OutNav = menuJson.filter((t) => t.inNavigation === false);
        const nv1InNav = menuJson.filter((t) => t.inNavigation === true);
        nv1OutNav.map((t) => (t.niveau1Out = true)),
          nv1InNav.map((t) => (t.niveau1In = true));
        const nv2OutNav =
          subNavOk && subNavOk.filter((s) => s.inNavigation == false);
        nv2OutNav.niveau2Out = true;
        const nv2InNav =
          subNavOk && subNavOk.filter((s) => s.inNavigation == true);
        nv2InNav.niveau2In = true;
        let finalNavOut = nv2OutNav > 0 ? { nv1OutNav, nv2OutNav } : nv1OutNav;
        let finalNavIn = nv2InNav > 0 ? { nv1InNav, nv2InNav } : nv1InNav;
        console.log(
          "---------------------------------- Visible en navigation (depuis le menu) --------------------------------------------"
        );
        let navInDecode = [];
        navInDecode.push(
          finalNavIn.map((node) => {
            return {
              title: node.title,
              alias: node.alias,
              path: node.path,
              inNavigation: node.inNavigation,
              subNab: node.subNav,
            };
          })
        );

        console.table(navInDecode[0]);
        console.log(
          "---------------------------------- Non visible dans la navigation (depuis le menu) --------------------------------------------"
        );
        let navOutDecode = [];
        navOutDecode.push(
          finalNavOut.map((node) => {
            return {
              title: node.title,
              alias: node.alias,
              path: node.path,
              inNavigation: node.inNavigation,
              subNab: node.subNav,
            };
          })
        );
        console.table(navOutDecode[0]);
        navOutDecode[0].map((t) => {
          console.log("links outer nav : ", window.location.origin + t.path);
        });
        // return all links page Duda website
        const links = [];
        const getAllPathValues = (obj) => {
          var values = [];

          const traverse = (obj) => {
            for (var key in obj) {
              if (key === "path") {
                const link = new URL(
                  window.location.origin + decodeURIComponent(escape(obj[key]))
                ).href;
                links.push(link);
              } else if (typeof obj[key] === "object") {
                traverse(obj[key]);
              }
            }
          };

          traverse(obj);
          return values;
        };
        console.log(
          "------------------------------------- All links Duda website ------------------------------"
        );
        getAllPathValues(menuJson);
        const allLinksDom = () => {
          let finalLink = [];
          links.forEach((t, i) => {
            const link = t.includes("#") ? t.split("#")[0] : t;
            if (link !== "https://solocaldudaadmin.eu-responsivesiteeditor.com/") {
              finalLink.push(`<a href="${link}">${link}</a><br>`);
            }
          });

          return [...new Set(finalLink)];
        };
        const newWindow = window.open(
          "_blank",
          "width=900,height=600,toolbar=no"
        );
        newWindow.document.write("<html><head><title>Sitemap Duda</title>");
        newWindow.document.write(
          "<style>.missing {background-color: white!important;color: orange!important;}.noMissingHeading { background-color:green }.duplicate { background-color: orange }</style>"
        );
        newWindow.document.write(`</head><body>${allLinksDom()}<body></html>`);
        newWindow.document.close();
      }
    },
  });
};