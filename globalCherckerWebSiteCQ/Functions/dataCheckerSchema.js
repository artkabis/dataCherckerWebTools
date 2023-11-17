dataChecker = {
    url_site: window.location.href,
    url_online: (document.querySelector('link[rel="canonical"]').getAttribute('href') && 
    document.querySelector('link[rel="canonical"]').getAttribute('href').includes('/site/')) ? 
    document.querySelector('link[rel="canonical"]').getAttribute('href').split('/site/')[0] : 
    document.querySelector('link[rel="canonical"]').getAttribute('href'),
    global_score: "2",
    state_check: "false",
    cdp_global_score: {
      check_title: "Global score CDP",
      global_score: 0,
      scores: [],
    },
    webdesigner_global_score: {
      check_title: "Global score Webdesigner",
      global_score: 0,
      scores: [],
    },
    meta_check: {
      meta_check_state: "false",
      nb_meta: "2",
      check_title: "Meta",
      global_score: "3",
      profil: ["CDP"],
      meta: [
        {
          meta_state: "false",
          meta_type: "title",
          meta_txt: "mon title magique performant et beau",
          meta_size: "6",
          meta_reco: "La reco est de 50 à 65 caractères.",
          meta_score: "5",
          check_title: "Meta title",
        },
        {
          meta_state: "false",
          meta_type: "description",
          meta_txt: "mon desc magique performant et beau",
          meta_size: "6",
          meta_reco: "la reco est de de 140 à 156 caractères.",
          meta_score: "10",
          check_title: "Meta description",
        },
      ],
    },
    link_check: {
      link_check_state: "false",
      nb_link: "1",
      check_title: "Links validities",
      global_score: "5",
      profil: ["CDP", "WEBDESIGNER"],
      link: [
        {
          link_state: "false",
          link_url: "www.monimage.com",
          link_status: 200,
          link_text: "mon lien",
          alt_img_score: "5",
        },
      ],
    },
    alt_img_check: {
      alt_img_check_state: "false",
      nb_alt_img: "1",
      check_title: "Images alt",
      global_score: "5",
      profil: ["CDP"],
      alt_img: [
        {
          alt_img_state: "true",
          alt_img_src: "www.monimage.com",
          alt_img_score: "5",
        },
      ],
    },
    img_check: {
      img_check_state: "false",
      nb_img: "1",
      nb_img_duplicate: [],
      check_title: "Images check",
      global_score: "5",
      profil: ["WEBDESIGNER"],
      alt_img: [
        {
          alt_img_state: "true",
          alt_img_src: "www.monimage.com",
          alt_img_score: "5",
          check_title: "Images alt",
        },
      ],
      size_img: [
        {
          size_img_state: "false",
          size_img_src: "www.monimage.com",
          size_img: "20KB",
          size_img_score: "5",
          check_title: "Images size",
        },
      ],
      ratio_img: [
        {
          ratio_img_state: "false",
          ratio_img_src: "www.monimage.com",
          type_img: "image/SRC",
          img_height: "100px",
          img_width: "100px",
          parent_img_height: "100px",
          parent_img_width: "100px",
          ratio_parent_img_height: "100px",
          ratio_parent_img_width: "100px",
          ratio_img: "20KB",
          ratio_img_score: "5",
          check_title: "Images ratio",
        },
      ],
    },
    hn: {
      hn_check_state: "false",
      nb_hn: "1",
      check_title: "Hn",
      global_score: "1",
      hn_reco: {
        profil: ["CDP"],
        global_score: "1",
        check_title: "Reco longueur Hn",
        hn_preco: "La preco est de 50 à 90 caractères",
        hn: [
          {
            hn_type: "h1",
            hn_letters_count: "10",
            hn_txt: "mon titre h1 est beau",
            hn_index: "1",
            hn_words_sliced: "5",
            hn_words_count: "4",
            hn_score: "5",
            check_title: "Reco longueur des Hn",
          },
          {
            hn_type: "h2",
            hn_letters_count: "10",
            hn_txt: "mon titre h1 est beau",
            hn_index: "1",
            hn_words_sliced: "5",
            hn_words_count: "4",
            hn_score: "5",
            check_title: "Reco longueur des Hn",
          },
        ],
      },
      hn_outline: {
        profil: ["CDP", "WEBDESIGNER"],
        check_title: "Validité du outline des Hn",
        global_score: "1",
        hn: [
          {
            hn_type: "h2",
            hn_validity: "true",
            hn_validity_message: "Valide",
          },
        ],
      },
    },
    bold_check: {
      bold_check_state: "false",
      nb_bold: "1",
      check_title: "validité des préco lié au bold des textes.",
      global_score: "0",
      profil: ["CDP"],
      bold_txt: [
        {
          bold_txt_state: "false",
          bold_txt_content: "exmple texte en gras.",
          bold_txt_score: "0",
        },
      ],
    },
  };