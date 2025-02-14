(() => {
    console.log('----------------------------- START Check Logo --------------------------------------------');
    const stackLogo = document.querySelector('#dmRoot') ? 'duda' : 'wp';

    if (stackLogo === "wp") {
        const logo = document.querySelector('#Top_bar .logo');
        if (logo.querySelectorAll('#logo img')?.length && logo.querySelector('#logo')?.getAttribute('title')?.length > 0) {
            console.log(`%cLogo renvoyant vers l'accueil avec titre définit : "${logo.querySelector('a').getAttribute('title')}"`, 'color:green');
        } else {
            console.log(`%cLe logo doit renvoyer vers l'accueil et comportait un title`, 'color:red');
        }
    } else if (stackLogo === "duda") {
        const logo = document.querySelector('.dmHeader .SOMS_logo');
        if (logo.querySelector('a') && logo.querySelector('img')?.getAttribute('title')) {
            console.log(`%cLogo renvoyant vers l'accueil avec titre définit : "${logo.querySelector('img')?.getAttribute('title')}"`, 'color:green');
        } else {
            console.log(`%cLe logo doit renvoyer vers l'accueil et comportait un title`, 'color:red');
        }
    }
    console.log('----------------------------- END Check Logo --------------------------------------------');
})()