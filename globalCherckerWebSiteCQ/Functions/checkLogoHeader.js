(() => {
    console.log('----------------------------- START Check Logo --------------------------------------------');
    const stackLogo = document.querySelector('#dmRoot') ? 'duda' : 'wp';

    if (stackLogo === "wp") {
        const logo = document.querySelector('#Top_bar .logo');
        if (logo) {
            if (logo?.querySelectorAll('#logo img')?.length && logo?.querySelector('#logo')?.getAttribute('title')?.length > 0) {
                console.log(`%cLogo renvoyant vers l'accueil avec titre définit : "${logo.querySelector('a').getAttribute('title')}"`, 'color:green');
            } else {
                console.log(`%cLe logo doit renvoyer vers l'accueil et comportait un title`, 'color:red');
            }
        } else {
            console.log(`%cAucun logo n'a été détecté !!!`, 'color:red');
        }
    } else if (stackLogo === "duda") {

        const logo = document.querySelector('.dmHeader div[data-element-type="image"]') ||
            document.querySelector('div[data-binding="W3siYmluZGluZ05hbWUiOiJpbWFnZSIsInZhbHVlIjoic2l0ZV9pbWFnZXMubG9nbyJ9XQ=="]');

        if (!logo) {
            console.log(`%cAucun logo n'a été détecté !!!`, 'color:red');
        } else {
            // Extraction des éléments pour éviter les répétitions
            const logoLink = logo.querySelector('a');
            const logoImg = logo.querySelector('img');
            const imgTitle = logoImg?.getAttribute('title');
            const linkHref = logoLink?.getAttribute('href');

            // Vérifications des conditions
            const hasLink = !!logoLink;
            const hasTitle = !!imgTitle;
            const hasValidHref = !!linkHref && linkHref.length > 0;

            if (hasLink && hasTitle && hasValidHref) {
                console.log(`%cLogo renvoyant vers l'accueil avec titre définit : "${imgTitle}"`, 'color:green');
            } else if (hasLink && hasTitle && !hasValidHref) {
                console.log(`%cLe logo ne comporte pas de lien valide vers la page d'accueil`, 'color:red');
            } else {
                console.log(`%cLe logo doit renvoyer vers l'accueil et comporter un title`, 'color:red');
            }
        }
    }
    console.log('----------------------------- END Check Logo --------------------------------------------');
})()