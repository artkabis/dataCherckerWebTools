(($)=>{

($('#dm')) && (
    console.log("-----------------------------Detection de l'ancien widget RPDG Duda-----------------------------"),$('.dmFooterContainer').text().toLowerCase().includes('solocal')) ? (console.log("%c!!! Attention le site comporte l'ancien widget RGPD lié au footer, vous devez le mettre à jour", 'color:red'),console.log("----------------------------- Fin de la detection de l'ancien widget RPDG Duda-----------------------------")) : '';

})(jQuery);