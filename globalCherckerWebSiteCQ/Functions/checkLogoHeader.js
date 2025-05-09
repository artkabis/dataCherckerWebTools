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

        const logo = document.querySelector('.dmHeader div[data-element-type="image"]') || document.querySelector('div[data-binding="W3siYmluZGluZ05hbWUiOiJpbWFnZSIsInZhbHVlIjoic2l0ZV9pbWFnZXMubG9nbyJ9XQ=="]');
        if (logo) {
            if (logo?.querySelector('a') && logo?.querySelector('img')?.getAttribute('title')) {
                console.log(`%cLogo renvoyant vers l'accueil avec titre définit : "${logo.querySelector('img')?.getAttribute('title')}"`, 'color:green');
            } else {
                console.log(`%cLe logo doit renvoyer vers l'accueil et comportait un title`, 'color:red');
            }
        } else {
            console.log(`%cAucun logo n'a été détecté !!!`, 'color:red');
        }
    }
    console.log('----------------------------- END Check Logo --------------------------------------------');
})()