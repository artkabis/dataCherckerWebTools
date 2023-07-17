/*console.log('result.js');
console.log(window['dataResult']);*/
(($)=>{
    $('body').append(`
    <div>
    <H1> Résultat du scan</H1>
    <div class='result'>${window['dataResult']}</div>
    </div>`)
})