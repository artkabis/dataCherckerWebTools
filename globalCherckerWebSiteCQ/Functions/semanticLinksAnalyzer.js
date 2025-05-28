/**
 * Vérification avancée de la cohérence entre le texte des liens et leurs pages d'atterrissage
 * VERSION OPTIMISÉE avec toutes les améliorations intégrées
 * Optimisé pour les sites web français avec analyse linguistique poussée
 * @version 3.0 - All-in-One Optimized
 */

export const semanticLinks = (tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () {
            /**
             * Analyseur de Cohérence des Liens - Version Optimisée Complète
             * Toutes les améliorations intégrées dans un seul script
             * @version 3.0
             */

            // ============================================================================
            // 1. CACHE LRU OPTIMISÉ
            // ============================================================================

            class LRUCache {
                constructor(maxSize = 1000) {
                    this.maxSize = maxSize;
                    this.cache = new Map();
                }

                get(key) {
                    if (this.cache.has(key)) {
                        const value = this.cache.get(key);
                        this.cache.delete(key);
                        this.cache.set(key, value);
                        return value;
                    }
                    return null;
                }

                set(key, value) {
                    if (this.cache.has(key)) {
                        this.cache.delete(key);
                    } else if (this.cache.size >= this.maxSize) {
                        const firstKey = this.cache.keys().next().value;
                        this.cache.delete(firstKey);
                    }
                    this.cache.set(key, value);
                }

                has(key) {
                    return this.cache.has(key);
                }
            }

            // ============================================================================
            // 2. PATTERNS FRANÇAIS ENRICHIS ET OPTIMISÉS
            // ============================================================================

            // Patterns de transformation optimisés par fréquence d'usage
            const ENHANCED_TRANSFORMATION_PATTERNS = [
                // PRIORITÉ 1: Transformations les plus courantes (80% des cas)

                // Pluriels réguliers (très fréquent)
                { from: /^(.{3,})$/, to: /^(.{3,})s$/, weight: 10, type: 'plural' },
                { from: /^(.{3,})$/, to: /^(.{3,})es$/, weight: 8, type: 'plural' },

                // Genre (très fréquent)
                { from: /^(.{3,})$/, to: /^(.{3,})e$/, weight: 9, type: 'gender' },
                { from: /^(.{3,})er$/, to: /^(.{3,})ère$/, weight: 7, type: 'gender' },
                { from: /^(.{3,})eur$/, to: /^(.{3,})euse$/, weight: 7, type: 'gender' },

                // Formes verbales courantes
                { from: /^(.{3,})er$/, to: /^(.{3,})(e|es|ent|ons|ez)$/, weight: 8, type: 'verb' },
                { from: /^(.{3,})ir$/, to: /^(.{3,})(is|it|issons|issez|issent)$/, weight: 7, type: 'verb' },
                { from: /^(.{3,})re$/, to: /^(.{3,})(s|t|ons|ez|ent)$/, weight: 6, type: 'verb' },

                // PRIORITÉ 2: Transformations spécifiques françaises

                // Pluriels irréguliers
                { from: /^(.+)eau$/, to: /^(.+)eaux$/, weight: 9, type: 'irregular_plural' },
                { from: /^(.+)eu$/, to: /^(.+)eux$/, weight: 8, type: 'irregular_plural' },
                { from: /^(.+)al$/, to: /^(.+)aux$/, weight: 8, type: 'irregular_plural' },
                { from: /^(.+)ail$/, to: /^(.+)aux$/, weight: 6, type: 'irregular_plural' },
                { from: /^(.+)ou$/, to: /^(.+)oux$/, weight: 5, type: 'irregular_plural' },

                // Formations dérivées (business-critical)
                { from: /^(.{3,})$/, to: /^(.{3,})(tion|sion|ation|isation)$/, weight: 9, type: 'derivation' },
                { from: /^(.{3,})$/, to: /^(.{3,})(ment|ement|issement)$/, weight: 8, type: 'derivation' },
                { from: /^(.{3,})$/, to: /^(.{3,})(age|isme|ité|eur|euse)$/, weight: 7, type: 'derivation' },
                { from: /^(.{3,})$/, to: /^(.{3,})(ance|ence|ure|erie)$/, weight: 6, type: 'derivation' },

                // Préfixations communes
                { from: /^(.{3,})$/, to: /^(re|pré|post|anti|pro|sous|sur)(.{3,})$/, weight: 7, type: 'prefix' },
                { from: /^(.{3,})$/, to: /^(dé|dés|in|im|ir|il|non)(.{3,})$/, weight: 8, type: 'prefix' },
                { from: /^(.{3,})$/, to: /^(inter|intra|extra|ultra|super|hyper)(.{3,})$/, weight: 6, type: 'prefix' },

                // Formations professionnelles
                { from: /^(.{3,})$/, to: /^(.{3,})(ien|ienne|ier|ière|iste|aire|eur|euse)$/, weight: 8, type: 'profession' },

                // Formations techniques
                { from: /^(.{3,})$/, to: /^(.{3,})(ique|isme|logie|graphie|thérapie)$/, weight: 6, type: 'technical' },

                // Diminutifs/augmentatifs
                { from: /^(.{3,})$/, to: /^(.{3,})(ette|ot|otte|eau|elle|illon|ine|ole)$/, weight: 5, type: 'diminutive' }
            ];

            // Groupes sémantiques enrichis avec contexte
            const ENHANCED_SEMANTIC_GROUPS = {
                // ============================================================================
                // NAVIGATION ET STRUCTURE SITE
                // ============================================================================

                // Navigation principale
                accueil: {
                    variants: ['accueil', 'home', 'bienvenue', 'index', 'principale', 'welcome', 'démarrage', 'entrée', 'maison', 'début', 'commencer', 'premier', 'racine'],
                    weight: 10,
                    context: ['nav', 'header', 'logo']
                },

                // Contact et communication
                contact: {
                    variants: [
                        'contact', 'contactez', 'nous contacter', 'me contacter', 'formulaire', 'message',
                        'écrire', 'écrivez', 'coordonnées', 'adresse', 'téléphone', 'tel', 'mail', 'email',
                        'courriel', 'joindre', 'appeler', 'appelez', 'demande', 'devis', 'rdv', 'rendez-vous',
                        'discussion', 'échange', 'dialogue', 'correspondance', 'communication', 'parler',
                        'discuter', 'échanger', 'communiquer', 'solliciter', 'questionner', 'interroger'
                    ],
                    weight: 9,
                    context: ['footer', 'nav', 'cta']
                },

                // À propos et présentation
                apropos: {
                    variants: [
                        'propos', 'à propos', 'présentation', 'équipe', 'entreprise', 'société', 'histoire',
                        'valeurs', 'philosophie', 'nous sommes', 'qui', 'about', 'découvrir', 'notre',
                        'mission', 'vision', 'engagement', 'parcours', 'expérience', 'savoir-faire', 'expertise',
                        'biographie', 'profil', 'identité', 'culture', 'éthique', 'ambition', 'objectif'
                    ],
                    weight: 8,
                    context: ['nav', 'footer']
                },

                // ============================================================================
                // SERVICES ET PRESTATIONS
                // ============================================================================

                // Services généraux
                services: {
                    variants: [
                        'service', 'services', 'prestation', 'prestations', 'offre', 'offres', 'solution',
                        'solutions', 'produit', 'produits', 'catalogue', 'gamme', 'proposition', 'activité',
                        'activités', 'métier', 'métiers', 'compétence', 'compétences', 'expertise', 'spécialité',
                        'domaine', 'secteur', 'branche', 'intervention', 'accompagnement', 'conseil', 'aide',
                        'assistance', 'support', 'maintenance', 'réparation', 'dépannage'
                    ],
                    weight: 9,
                    context: ['nav', 'main', 'cta']
                },

                // Peinture et décoration
                peinture: {
                    variants: [
                        'peinture', 'peindre', 'peintre', 'peintres', 'couleur', 'couleurs', 'teinte', 'teintes', 'nuance', 'nuances',
                        'coloration', 'coloris', 'revêtement', 'finition', 'décoration', 'embellissement',
                        'rénovation', 'restauration', 'rafraîchissement', 'relooking', 'customisation',
                        'badigeon', 'enduit', 'crépi', 'tapisserie', 'papier peint', 'vernissage', 'laquage',
                        'changer', 'modifier', 'transformer', 'rénover', 'refaire', 'repeindre', 'colorier'
                    ],
                    weight: 8,
                    context: ['service', 'produit']
                },

                // Rénovation et travaux
                renovation: {
                    variants: [
                        'rénovation', 'renovation', 'travaux', 'chantier', 'construction', 'bâtiment', 'batiment',
                        'réhabilitation', 'restauration', 'remise en état', 'amélioration', 'modernisation',
                        'transformation', 'aménagement', 'extension', 'agrandissement', 'restructuration',
                        'réfection', 'reconstruction', 'réparation', 'entretien', 'maintenance'
                    ],
                    weight: 8,
                    context: ['service', 'travaux']
                },

                // ============================================================================
                // ESPACES ET LIEUX
                // ============================================================================

                // Intérieur
                interieur: {
                    variants: [
                        'intérieur', 'interieur', 'interne', 'dedans', 'pièce', 'pièces', 'chambre', 'salon',
                        'cuisine', 'salle', 'bureau', 'couloir', 'entrée', 'hall', 'séjour', 'living',
                        'appartement', 'maison', 'logement', 'habitation', 'domicile', 'résidence',
                        'local', 'locaux', 'espace', 'espaces', 'zone', 'zones', 'surface', 'surfaces'
                    ],
                    weight: 7,
                    context: ['service', 'location']
                },

                // Extérieur
                exterieur: {
                    variants: [
                        'extérieur', 'exterieur', 'externe', 'dehors', 'façade', 'facade', 'mur', 'murs',
                        'garage', 'bâtiment', 'batiment', 'construction', 'habitation', 'maison', 'villa',
                        'immeuble', 'édifice', 'structure', 'local', 'locaux', 'terrasse', 'balcon',
                        'jardin', 'cour', 'parking', 'abri', 'hangar', 'atelier', 'entrepôt'
                    ],
                    weight: 7,
                    context: ['service', 'location']
                },

                // Commercial et bureaux
                commercial: {
                    variants: [
                        'commercial', 'bureau', 'bureaux', 'entreprise', 'société', 'magasin', 'boutique',
                        'commerce', 'local commercial', 'espace de travail', 'coworking', 'open space',
                        'salle de réunion', 'showroom', 'vitrine', 'accueil', 'réception'
                    ],
                    weight: 6,
                    context: ['service', 'professionnel']
                },

                // ============================================================================
                // MÉDIAS ET CONTENU
                // ============================================================================

                // Médias et visuels
                medias: {
                    variants: [
                        'photo', 'photos', 'image', 'images', 'galerie', 'album', 'portfolio', 'réalisation',
                        'réalisations', 'aperçu', 'visuel', 'visuels', 'voir', 'visionner', 'regarder',
                        'vidéo', 'vidéos', 'média', 'médias', 'multimédia', 'illustration', 'capture',
                        'cliché', 'instantané', 'screenshot', 'miniature', 'vignette', 'diaporama'
                    ],
                    weight: 7,
                    context: ['nav', 'gallery']
                },

                // Actualités et blog
                actualites: {
                    variants: [
                        'actualité', 'actualités', 'actu', 'actus', 'news', 'nouvelle', 'nouvelles',
                        'blog', 'article', 'articles', 'publication', 'publications', 'information',
                        'informations', 'communiqué', 'annonce', 'événement', 'événements', 'agenda',
                        'édito', 'éditorial', 'chronique', 'tribune', 'témoignage', 'interview'
                    ],
                    weight: 6,
                    context: ['nav', 'sidebar']
                },

                // ============================================================================
                // SECTEURS D'ACTIVITÉ TPE/PME FRANÇAISES
                // ============================================================================

                // Immobilier
                immobilier: {
                    variants: [
                        'immobilier', 'bien', 'biens', 'propriété', 'patrimoine', 'vente', 'achat', 'location',
                        'appartement', 'maison', 'villa', 'studio', 'loft', 'duplex', 'triplex',
                        'terrain', 'parcelle', 'investissement', 'placement', 'rentabilité'
                    ],
                    weight: 7,
                    context: ['secteur', 'service']
                },

                // Automobile
                automobile: {
                    variants: [
                        'auto', 'automobile', 'voiture', 'véhicule', 'car', 'moto', 'camion', 'utilitaire',
                        'garage', 'mécanique', 'réparation', 'entretien', 'carrosserie', 'peinture auto',
                        'pneu', 'pneus', 'révision', 'vidange', 'diagnostic', 'contrôle technique'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Santé et bien-être
                sante: {
                    variants: [
                        'santé', 'médical', 'soin', 'soins', 'thérapie', 'traitement', 'consultation',
                        'bien-être', 'wellness', 'relaxation', 'détente', 'massage', 'spa',
                        'beauté', 'esthétique', 'cosmétique', 'hygiène', 'forme', 'fitness'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Formation et éducation
                formation: {
                    variants: [
                        'formation', 'formations', 'cours', 'apprentissage', 'enseignement', 'éducation',
                        'stage', 'stages', 'atelier', 'ateliers', 'séminaire', 'conférence', 'webinaire',
                        'école', 'université', 'institut', 'académie', 'centre de formation',
                        'certification', 'diplôme', 'qualification', 'compétence', 'skill'
                    ],
                    weight: 7,
                    context: ['secteur', 'service']
                },

                // Technologie et informatique
                technologie: {
                    variants: [
                        'technologie', 'tech', 'informatique', 'digital', 'numérique', 'web', 'internet',
                        'site', 'application', 'app', 'logiciel', 'software', 'développement', 'dev',
                        'programmation', 'code', 'système', 'réseau', 'sécurité', 'cybersécurité',
                        'intelligence artificielle', 'ia', 'machine learning', 'data', 'données'
                    ],
                    weight: 7,
                    context: ['secteur', 'service']
                },

                // ============================================================================
                // ARTISANAT ET MÉTIERS DU BÂTIMENT (TPE/PME françaises)
                // ============================================================================

                // Plomberie et chauffage
                plomberie: {
                    variants: [
                        'plomberie', 'plombier', 'plombiers', 'chauffage', 'chauffagiste', 'sanitaire',
                        'tuyauterie', 'canalisation', 'robinetterie', 'chaudière', 'radiateur',
                        'installation', 'dépannage', 'réparation', 'fuite', 'débouchage',
                        'climatisation', 'ventilation', 'pompe à chaleur', 'chauffe-eau'
                    ],
                    weight: 8,
                    context: ['artisan', 'service', 'urgence']
                },

                // Électricité
                electricite: {
                    variants: [
                        'électricité', 'électricien', 'électriciens', 'électrique', 'installation électrique',
                        'tableau électrique', 'prise', 'interrupteur', 'éclairage', 'luminaire',
                        'domotique', 'alarme', 'vidéophone', 'portail automatique',
                        'mise aux normes', 'diagnostic électrique', 'court-circuit', 'panne'
                    ],
                    weight: 8,
                    context: ['artisan', 'service', 'urgence']
                },

                // Menuiserie et ébénisterie
                menuiserie: {
                    variants: [
                        'menuiserie', 'menuisier', 'ébénisterie', 'ébéniste', 'bois', 'charpente',
                        'porte', 'fenêtre', 'volet', 'escalier', 'parquet', 'lambris',
                        'meuble', 'mobilier', 'agencement', 'sur mesure', 'custom',
                        'restauration', 'ponçage', 'vernissage', 'lasure'
                    ],
                    weight: 7,
                    context: ['artisan', 'fabrication']
                },

                // Maçonnerie et gros œuvre
                maconnerie: {
                    variants: [
                        'maçonnerie', 'maçon', 'gros œuvre', 'béton', 'parpaing', 'brique',
                        'fondation', 'mur', 'cloison', 'dalle', 'chape', 'enduit',
                        'carrelage', 'carreleur', 'faïence', 'pierre', 'pavage',
                        'terrassement', 'démolition', 'construction'
                    ],
                    weight: 7,
                    context: ['artisan', 'construction']
                },

                // Couverture et toiture
                couverture: {
                    variants: [
                        'couverture', 'couvreur', 'toiture', 'toit', 'tuile', 'ardoise', 'zinc',
                        'charpente', 'zinguerie', 'gouttière', 'descente', 'isolation',
                        'étanchéité', 'velux', 'lucarne', 'démoussage', 'nettoyage'
                    ],
                    weight: 7,
                    context: ['artisan', 'toiture']
                },

                // ============================================================================
                // COMMERCES DE PROXIMITÉ (TPE françaises)
                // ============================================================================

                // Coiffure et esthétique
                coiffure: {
                    variants: [
                        'coiffure', 'coiffeur', 'coiffeuse', 'salon de coiffure', 'barbier',
                        'esthétique', 'esthéticienne', 'beauté', 'soin du visage', 'épilation',
                        'manucure', 'pédicure', 'onglerie', 'maquillage', 'relooking',
                        'coloration', 'mèches', 'balayage', 'brushing', 'coupe'
                    ],
                    weight: 6,
                    context: ['commerce', 'service']
                },

                // Boulangerie et pâtisserie
                boulangerie: {
                    variants: [
                        'boulangerie', 'boulanger', 'pâtisserie', 'pâtissier', 'pain', 'viennoiserie',
                        'croissant', 'gâteau', 'tarte', 'sandwich', 'snacking',
                        'artisan boulanger', 'farine', 'levain', 'tradition', 'bio'
                    ],
                    weight: 6,
                    context: ['commerce', 'alimentaire']
                },

                // Pharmacie et parapharmacie
                pharmacie: {
                    variants: [
                        'pharmacie', 'pharmacien', 'parapharmacie', 'médicament', 'ordonnance',
                        'conseil', 'homéopathie', 'phytothérapie', 'aromathérapie',
                        'cosmétique', 'diététique', 'orthopédie', 'matériel médical'
                    ],
                    weight: 6,
                    context: ['commerce', 'santé']
                },

                // ============================================================================
                // SECTEURS SPÉCIALISÉS DEMANDÉS
                // ============================================================================

                // Avocats et juridique
                avocat: {
                    variants: [
                        'avocat', 'avocats', 'cabinet d\'avocat', 'juridique', 'droit', 'juriste',
                        'conseil juridique', 'contentieux', 'litige', 'procédure', 'tribunal',
                        'défense', 'représentation', 'plaidoirie', 'consultation juridique',
                        'droit civil', 'droit pénal', 'droit commercial', 'droit du travail',
                        'droit de la famille', 'divorce', 'succession', 'immobilier juridique',
                        'contrat', 'bail', 'médiation', 'arbitrage', 'expertise judiciaire'
                    ],
                    weight: 8,
                    context: ['professionnel', 'service', 'conseil']
                },

                // Assurance
                assurance: {
                    variants: [
                        'assurance', 'assurances', 'assureur', 'courtier', 'agent général',
                        'mutuelle', 'prévoyance', 'protection', 'couverture', 'garantie',
                        'auto', 'habitation', 'santé', 'vie', 'décès', 'invalidité',
                        'responsabilité civile', 'professionnelle', 'multirisque',
                        'sinistre', 'indemnisation', 'expertise', 'déclaration',
                        'contrat', 'police', 'prime', 'cotisation', 'franchise'
                    ],
                    weight: 8,
                    context: ['finance', 'service', 'protection']
                },

                // Finance et crédit
                finance: {
                    variants: [
                        'finance', 'crédit', 'prêt', 'emprunt', 'financement', 'banque',
                        'courtier en crédit', 'crédit immobilier', 'prêt personnel',
                        'crédit consommation', 'rachat de crédit', 'renégociation',
                        'investissement', 'placement', 'épargne', 'livret', 'assurance vie',
                        'bourse', 'action', 'obligation', 'fonds', 'portefeuille',
                        'conseil financier', 'gestion de patrimoine', 'fiscalité',
                        'taux', 'intérêt', 'mensualité', 'apport', 'capacité d\'emprunt'
                    ],
                    weight: 8,
                    context: ['finance', 'service', 'conseil']
                },

                // ============================================================================
                // AUTRES TPE/PME FRANÇAISES COURANTES
                // ============================================================================

                // Agriculture et alimentaire
                agriculture: {
                    variants: [
                        'agriculture', 'agriculteur', 'exploitation agricole', 'ferme', 'élevage',
                        'maraîchage', 'légumes', 'fruits', 'bio', 'local', 'circuit court',
                        'vente directe', 'marché', 'amap', 'producteur', 'terroir',
                        'viticulture', 'vignoble', 'cave', 'dégustation', 'oenologie'
                    ],
                    weight: 6,
                    context: ['secteur', 'production']
                },

                // Textile et mode
                textile: {
                    variants: [
                        'textile', 'mode', 'vêtement', 'prêt-à-porter', 'couture', 'retouche',
                        'boutique', 'magasin de vêtements', 'créateur', 'styliste',
                        'sur mesure', 'confection', 'maroquinerie', 'chaussure',
                        'accessoire', 'bijou', 'parfumerie', 'tendance', 'collection'
                    ],
                    weight: 6,
                    context: ['commerce', 'création']
                },

                // Hôtellerie et tourisme
                hotellerie: {
                    variants: [
                        'hôtel', 'hôtellerie', 'hébergement', 'chambre d\'hôtes', 'gîte',
                        'tourisme', 'voyage', 'vacances', 'séjour', 'réservation',
                        'restauration', 'bar', 'brasserie', 'café', 'traiteur',
                        'réception', 'conciergerie', 'spa', 'wellness', 'loisirs'
                    ],
                    weight: 6,
                    context: ['service', 'accueil']
                },

                // Nettoyage et entretien
                nettoyage: {
                    variants: [
                        'nettoyage', 'entretien', 'ménage', 'femme de ménage', 'aide ménagère',
                        'pressing', 'laverie', 'nettoyage à sec', 'repassage',
                        'vitres', 'sols', 'moquette', 'désinfection', 'hygiène',
                        'entreprise de nettoyage', 'multi-services', 'conciergerie'
                    ],
                    weight: 6,
                    context: ['service', 'entretien']
                },

                // Jardinage et paysagisme
                jardinage: {
                    variants: [
                        'jardinage', 'jardinier', 'paysagisme', 'paysagiste', 'espaces verts',
                        'pelouse', 'tonte', 'taille', 'élagage', 'plantation', 'arrosage',
                        'aménagement paysager', 'terrasse', 'clôture', 'portail',
                        'entretien', 'débroussaillage', 'création', 'conception'
                    ],
                    weight: 6,
                    context: ['service', 'extérieur']
                },

                // Services à la personne
                services_personne: {
                    variants: [
                        'services à la personne', 'aide à domicile', 'assistance', 'accompagnement',
                        'garde d\'enfants', 'baby-sitting', 'nounou', 'crèche',
                        'soutien scolaire', 'cours particuliers', 'aide aux devoirs',
                        'aide aux seniors', 'maintien à domicile', 'soins infirmiers',
                        'portage de repas', 'téléassistance', 'bricolage', 'jardinage'
                    ],
                    weight: 7,
                    context: ['service', 'social']
                },

                // Comptabilité et gestion
                comptabilite: {
                    variants: [
                        'comptabilité', 'comptable', 'expert-comptable', 'gestion', 'fiscal',
                        'déclaration', 'bilan', 'tva', 'charges sociales', 'paie',
                        'conseil', 'audit', 'expertise', 'commissaire aux comptes',
                        'social', 'juridique', 'création d\'entreprise', 'domiciliation'
                    ],
                    weight: 7,
                    context: ['service', 'professionnel']
                },

                // Sécurité et gardiennage
                securite: {
                    variants: [
                        'sécurité', 'protection', 'surveillance', 'gardiennage', 'alarme', 'vidéosurveillance',
                        'contrôle d\'accès', 'badge', 'serrurerie', 'blindage', 'coffre-fort',
                        'assurance', 'garantie', 'couverture', 'risque', 'prévention',
                        'agent de sécurité', 'vigile', 'ronde', 'télésurveillance'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Vétérinaire et animalerie
                veterinaire: {
                    variants: [
                        'vétérinaire', 'véto', 'animal', 'animaux', 'chien', 'chat', 'nac',
                        'consultation', 'vaccination', 'stérilisation', 'urgence vétérinaire',
                        'animalerie', 'pension', 'garde d\'animaux', 'toilettage',
                        'éducation canine', 'dressage', 'comportementaliste'
                    ],
                    weight: 6,
                    context: ['service', 'santé']
                },

                // ============================================================================
                // ACTIONS ET VERBES
                // ============================================================================

                // Actions de découverte
                decouvrir: {
                    variants: [
                        'découvrir', 'decouvrir', 'explorer', 'voir', 'visiter', 'parcourir', 'naviguer',
                        'consulter', 'examiner', 'observer', 'regarder', 'visionner', 'apercevoir',
                        'révéler', 'dévoiler', 'présenter', 'montrer', 'exposer', 'afficher'
                    ],
                    weight: 5,
                    context: ['action', 'cta']
                },

                // Actions d'information
                savoir: {
                    variants: [
                        'savoir', 'apprendre', 'comprendre', 'connaître', 'information', 'renseignement',
                        'détail', 'précision', 'explication', 'clarification', 'éclaircissement',
                        'plus d\'info', 'plus d\'infos', 'en savoir plus', 'plus de détails'
                    ],
                    weight: 5,
                    context: ['action', 'cta']
                },

                // Actions commerciales
                achat: {
                    variants: [
                        'acheter', 'achat', 'commander', 'commande', 'réserver', 'réservation', 'booking',
                        'panier', 'boutique', 'shop', 'store', 'magasin', 'vente', 'vendre',
                        'prix', 'tarif', 'coût', 'devis', 'estimation', 'gratuit', 'offert'
                    ],
                    weight: 6,
                    context: ['action', 'commercial']
                },

                // ============================================================================
                // CONCEPTS SPÉCIALISÉS
                // ============================================================================

                // Événementiel
                evenementiel: {
                    variants: [
                        'événement', 'évènement', 'event', 'manifestation', 'célébration', 'fête',
                        'mariage', 'anniversaire', 'baptême', 'communion', 'bar-mitzvah',
                        'congrès', 'salon', 'exposition', 'festival', 'spectacle', 'concert',
                        'organisation', 'planification', 'coordination', 'animation'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Restauration
                restauration: {
                    variants: [
                        'restaurant', 'resto', 'cuisine', 'repas', 'menu', 'carte', 'plat', 'plats',
                        'gastronomie', 'chef', 'cuisinier', 'service', 'brasserie', 'bistrot',
                        'café', 'bar', 'traiteur', 'catering', 'livraison', 'à emporter'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Transport et logistique
                transport: {
                    variants: [
                        'transport', 'livraison', 'logistique', 'expédition', 'envoi', 'colis',
                        'déménagement', 'transfert', 'acheminement', 'distribution', 'circulation',
                        'voyage', 'déplacement', 'mobilité', 'taxi', 'vtc', 'navette'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Sécurité
                securite: {
                    variants: [
                        'sécurité', 'protection', 'surveillance', 'gardiennage', 'alarme', 'vidéosurveillance',
                        'contrôle d\'accès', 'badge', 'serrurerie', 'blindage', 'coffre-fort',
                        'assurance', 'garantie', 'couverture', 'risque', 'prévention'
                    ],
                    weight: 6,
                    context: ['secteur', 'service']
                },

                // Environnement et écologie
                environnement: {
                    variants: [
                        'environnement', 'écologie', 'écologique', 'durable', 'durabilité', 'vert', 'green',
                        'bio', 'naturel', 'organique', 'recyclage', 'tri', 'déchets', 'pollution',
                        'énergie', 'renouvelable', 'solaire', 'éolien', 'géothermie', 'économie'
                    ],
                    weight: 6,
                    context: ['secteur', 'valeurs']
                },

                // ============================================================================
                // MENTIONS LÉGALES ET CONFORMITÉ
                // ============================================================================

                // Légal et mentions
                legal: {
                    variants: [
                        'mention', 'mentions', 'légale', 'légales', 'condition', 'conditions', 'cgv', 'cgu',
                        'juridique', 'cookie', 'cookies', 'confidentialité', 'privacy', 'vie privée',
                        'données', 'personnel', 'personnelles', 'rgpd', 'politique', 'charte', 'règlement',
                        'conformité', 'compliance', 'droit', 'loi', 'réglementation', 'clause'
                    ],
                    weight: 5,
                    context: ['footer']
                },

                // ============================================================================
                // OUTILS ET RESSOURCES
                // ============================================================================

                // Documentation et aide
                aide: {
                    variants: [
                        'aide', 'help', 'support', 'assistance', 'guide', 'manuel', 'documentation',
                        'faq', 'questions fréquentes', 'tutoriel', 'mode d\'emploi', 'notice',
                        'conseil', 'recommandation', 'astuce', 'tip', 'suggestion'
                    ],
                    weight: 5,
                    context: ['service', 'support']
                },

                // Téléchargement et ressources
                telechargement: {
                    variants: [
                        'téléchargement', 'telechargement', 'download', 'télécharger', 'telecharger',
                        'fichier', 'document', 'pdf', 'brochure', 'catalogue', 'plaquette',
                        'ressource', 'outil', 'template', 'modèle', 'exemple'
                    ],
                    weight: 5,
                    context: ['action', 'ressource']
                },

                // Recherche et navigation
                recherche: {
                    variants: [
                        'recherche', 'rechercher', 'search', 'chercher', 'trouver', 'localiser',
                        'filtrer', 'trier', 'sélectionner', 'choisir', 'comparer', 'naviguer',
                        'parcourir', 'explorer', 'plan du site', 'sitemap', 'index'
                    ],
                    weight: 5,
                    context: ['navigation', 'outil']
                }
            };

            // Patterns contextuels enrichis
            const CONTEXTUAL_PATTERNS = {
                business: [
                    { pattern: /(?:nos|notre|mes|mon)\s+(.+)/, urlMatch: /(.+)/, weight: 8 },
                    { pattern: /(.+)\s+(?:de|du|des)\s+(?:entreprise|société|groupe)/, urlMatch: /(.+)/, weight: 7 },
                    { pattern: /(?:découvrir|voir|consulter)\s+(.+)/, urlMatch: /(.+)/, weight: 6 },
                    { pattern: /(?:toutes|tous)\s+(?:nos|les)\s+(.+)/, urlMatch: /(.+)/, weight: 7 }
                ],

                ecommerce: [
                    { pattern: /(?:acheter|commander|réserver)\s+(.+)/, urlMatch: /(.+)/, weight: 9 },
                    { pattern: /(.+)\s+(?:en ligne|online)/, urlMatch: /(.+)/, weight: 7 },
                    { pattern: /(?:boutique|magasin|shop)\s+(.+)/, urlMatch: /(.+)/, weight: 8 },
                    { pattern: /(?:gamme|collection)\s+(.+)/, urlMatch: /(.+)/, weight: 6 }
                ],

                content: [
                    { pattern: /(?:lire|voir)\s+(.+)/, urlMatch: /(.+)/, weight: 6 },
                    { pattern: /(.+)\s+(?:complet|détaillé|approfondi)/, urlMatch: /(.+)/, weight: 5 },
                    { pattern: /(?:tout|toute)\s+(.+)/, urlMatch: /(.+)/, weight: 5 }
                ]
            };

            // ============================================================================
            // 3. FONCTIONS UTILITAIRES OPTIMISÉES
            // ============================================================================

            // Caches globaux
            const normalizeCache = new LRUCache(500);
            const wordsCache = new LRUCache(500);
            const stemCache = new LRUCache(200);
            const semanticCache = new LRUCache(1000);

            /**
             * Normalise une chaîne de caractères en français de manière optimisée
             */
            function normalizeTextOptimized(text) {
                if (!text) return "";

                const cached = normalizeCache.get(text);
                if (cached) return cached;

                const normalized = text
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^\w\s\-]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                normalizeCache.set(text, normalized);
                return normalized;
            }

            /**
             * Extrait les mots individuels d'une chaîne avec optimisations
             */
            function extractWordsOptimized(text) {
                if (!text) return [];

                const cached = wordsCache.get(text);
                if (cached) return cached;

                const normalizedText = normalizeTextOptimized(text);
                const words = new Set();
                const fullWords = normalizedText.split(/\s+/);

                fullWords.forEach((word) => {
                    if (word.length > 2) {
                        words.add(word);
                        // Mots composés avec tirets
                        if (word.includes("-")) {
                            word.split("-").forEach(part => {
                                if (part.length > 2) words.add(part);
                            });
                        }
                    }
                });

                const result = Array.from(words);
                wordsCache.set(text, result);
                return result;
            }

            /**
             * Stemming rapide et optimisé pour le français
             */
            function fastStemFrench(word) {
                if (!word || word.length <= 4) return word;

                const cached = stemCache.get(word);
                if (cached) return cached;

                let stem = word;

                // Suffixes courants triés par priorité et longueur
                const prioritySuffixes = [
                    'issement', 'ation', 'ement', 'ance', 'ence', 'tion', 'sion',
                    'eur', 'euse', 'ier', 'ière', 'iste', 'ante', 'ent', 'ant',
                    'er', 'ir', 're', 'es', 'e', 's'
                ];

                for (const suffix of prioritySuffixes) {
                    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
                        stem = word.slice(0, -suffix.length);
                        break;
                    }
                }

                stemCache.set(word, stem);
                return stem;
            }

            /**
             * Distance de Levenshtein optimisée (early exit)
             */
            function quickLevenshteinDistance(a, b) {
                if (a === b) return 0;
                if (a.length === 0) return b.length;
                if (b.length === 0) return a.length;

                // Early exit si différence de taille trop importante
                if (Math.abs(a.length - b.length) > 2) return 3;

                // Pour de petites chaînes, calcul rapide
                if (a.length <= 4 && b.length <= 4) {
                    let changes = 0;
                    const minLen = Math.min(a.length, b.length);

                    for (let i = 0; i < minLen; i++) {
                        if (a[i] !== b[i]) changes++;
                        if (changes > 2) return 3; // Early exit
                    }

                    return changes + Math.abs(a.length - b.length);
                }

                // Algorithme standard pour les chaînes plus longues
                let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

                for (let i = 0; i < a.length; i++) {
                    const currentRow = [i + 1];

                    for (let j = 0; j < b.length; j++) {
                        const insertCost = previousRow[j + 1] + 1;
                        const deleteCost = currentRow[j] + 1;
                        const replaceCost = previousRow[j] + (a[i] !== b[j] ? 1 : 0);

                        currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
                    }

                    previousRow = currentRow;
                }

                return previousRow[b.length];
            }

            /**
             * Vérifie si deux mots sont des formes liées via les patterns français
             */
            function areRelatedWordFormsOptimized(word1, word2) {
                if (!word1 || !word2 || word1 === word2) return word1 === word2;

                const cacheKey = `${word1}|${word2}`;
                const cached = semanticCache.get(cacheKey);
                if (cached !== null) return cached;

                // Test rapide avec les stems
                const stem1 = fastStemFrench(word1);
                const stem2 = fastStemFrench(word2);
                if (stem1 === stem2 && stem1.length > 3) {
                    semanticCache.set(cacheKey, true);
                    return true;
                }

                // Test avec les patterns optimisés
                for (const pattern of ENHANCED_TRANSFORMATION_PATTERNS) {
                    if (testTransformationPattern(word1, word2, pattern)) {
                        semanticCache.set(cacheKey, true);
                        return true;
                    }
                }

                semanticCache.set(cacheKey, false);
                return false;
            }

            /**
             * Teste un pattern de transformation spécifique
             */
            function testTransformationPattern(word1, word2, pattern) {
                // Test bidirectionnel optimisé
                const test1 = testSingleDirection(word1, word2, pattern);
                if (test1) return true;

                return testSingleDirection(word2, word1, pattern);
            }

            function testSingleDirection(from, to, pattern) {
                const match1 = from.match(pattern.from);
                const match2 = to.match(pattern.to);

                if (match1 && match2 && match1[1] && match2[1]) {
                    const stem1 = match1[1];
                    const stem2 = match2[1];

                    // Vérification de proximité des racines
                    return quickLevenshteinDistance(stem1, stem2) <= 1;
                }

                return false;
            }

            /**
             * Vérifie la correspondance avec les groupes sémantiques
             */
            function checkSemanticGroups(linkText, urlSegment) {
                const normalizedLink = normalizeTextOptimized(linkText);
                const normalizedUrl = normalizeTextOptimized(urlSegment);

                for (const [groupName, group] of Object.entries(ENHANCED_SEMANTIC_GROUPS)) {
                    const linkMatches = group.variants.filter(variant =>
                        normalizedLink.includes(normalizeTextOptimized(variant))
                    );

                    const urlMatches = group.variants.filter(variant =>
                        normalizedUrl.includes(normalizeTextOptimized(variant))
                    );

                    if (linkMatches.length > 0 && urlMatches.length > 0) {
                        const confidence = Math.min(group.weight / 10, 1.0);
                        return {
                            isCoherent: true,
                            reason: `Groupe sémantique "${groupName}": ${linkMatches[0]} ↔ ${urlMatches[0]}`,
                            confidence,
                            matchType: 'semantic_group'
                        };
                    }
                }

                return null;
            }

            /**
             * Vérifie les patterns contextuels
             */
            function checkContextualPatterns(linkText, urlSegment) {
                for (const [context, patterns] of Object.entries(CONTEXTUAL_PATTERNS)) {
                    for (const pattern of patterns) {
                        const linkMatch = linkText.match(pattern.pattern);
                        if (linkMatch && linkMatch[1]) {
                            const extractedWord = normalizeTextOptimized(linkMatch[1]);
                            const normalizedUrl = normalizeTextOptimized(urlSegment);

                            if (normalizedUrl.includes(extractedWord)) {
                                const confidence = Math.min(pattern.weight / 10, 1.0);
                                return {
                                    isCoherent: true,
                                    reason: `Pattern contextuel (${context}): "${linkMatch[1]}"`,
                                    confidence,
                                    matchType: 'contextual'
                                };
                            }
                        }
                    }
                }

                return null;
            }

            // ============================================================================
            // 4. MOTEUR SÉMANTIQUE OPTIMISÉ
            // ============================================================================

            /**
             * Vérifie la cohérence sémantique entre deux textes - VERSION OPTIMISÉE
             */
            function checkSemanticCoherenceOptimized(linkText, urlSegment) {
                if (!linkText || !urlSegment) {
                    return { isCoherent: false, reason: "Texte ou URL manquant" };
                }

                const cacheKey = `${linkText}|${urlSegment}`;
                const cached = semanticCache.get(cacheKey);
                if (cached) return cached;

                // Analyse par étapes (du plus simple au plus complexe)
                let result = null;

                // 1. Correspondance exacte (le plus rapide)
                result = checkExactMatch(linkText, urlSegment);
                if (result) {
                    semanticCache.set(cacheKey, result);
                    return result;
                }

                // 2. Groupes sémantiques (priorité haute)
                result = checkSemanticGroups(linkText, urlSegment);
                if (result) {
                    semanticCache.set(cacheKey, result);
                    return result;
                }

                // 3. Patterns contextuels
                result = checkContextualPatterns(linkText, urlSegment);
                if (result) {
                    semanticCache.set(cacheKey, result);
                    return result;
                }

                // 4. Patterns français linguistiques
                result = checkFrenchLinguisticPatterns(linkText, urlSegment);
                if (result) {
                    semanticCache.set(cacheKey, result);
                    return result;
                }

                // 5. Correspondance floue (plus coûteuse)
                result = checkFuzzyMatch(linkText, urlSegment);
                if (result) {
                    semanticCache.set(cacheKey, result);
                    return result;
                }

                // Aucune correspondance trouvée
                result = { isCoherent: false, reason: "Aucune correspondance trouvée" };
                semanticCache.set(cacheKey, result);
                return result;
            }

            function checkExactMatch(linkText, urlSegment) {
                const linkWords = extractWordsOptimized(linkText);
                const urlWords = extractWordsOptimized(urlSegment);

                for (const linkWord of linkWords) {
                    for (const urlWord of urlWords) {
                        if (linkWord === urlWord && linkWord.length > 3) {
                            return {
                                isCoherent: true,
                                reason: `Correspondance exacte: "${linkWord}"`,
                                confidence: 1.0,
                                matchType: 'exact'
                            };
                        }
                    }
                }

                return null;
            }

            function checkFrenchLinguisticPatterns(linkText, urlSegment) {
                const linkWords = extractWordsOptimized(linkText);
                const urlWords = extractWordsOptimized(urlSegment);

                for (const linkWord of linkWords) {
                    for (const urlWord of urlWords) {
                        if (linkWord.length > 3 && urlWord.length > 3) {
                            if (areRelatedWordFormsOptimized(linkWord, urlWord)) {
                                return {
                                    isCoherent: true,
                                    reason: `Formes linguistiques liées: "${linkWord}" ↔ "${urlWord}"`,
                                    confidence: 0.9,
                                    matchType: 'linguistic'
                                };
                            }
                        }
                    }
                }

                return null;
            }

            function checkFuzzyMatch(linkText, urlSegment) {
                const linkWords = extractWordsOptimized(linkText);
                const urlWords = extractWordsOptimized(urlSegment);

                for (const linkWord of linkWords) {
                    for (const urlWord of urlWords) {
                        if (linkWord.length > 5 && urlWord.length > 5) { // Augmenté de 4 à 5
                            const distance = quickLevenshteinDistance(linkWord, urlWord);
                            // Seuil plus strict : max 1 erreur pour mots courts, 2 pour longs
                            const maxDistance = linkWord.length <= 6 ? 1 : 2;

                            if (distance <= maxDistance && distance > 0) {
                                // Validation sémantique supplémentaire
                                if (isSemanticallySimilar(linkWord, urlWord)) {
                                    const confidence = 1 - (distance / Math.max(linkWord.length, urlWord.length));
                                    return {
                                        isCoherent: true,
                                        reason: `Correspondance approximative validée: "${linkWord}" ≈ "${urlWord}"`,
                                        confidence: confidence * 0.6, // Réduit encore la confiance
                                        matchType: 'fuzzy'
                                    };
                                }
                            }
                        }
                    }
                }

                return null;
            }

            /**
             * Vérifie si deux mots sont sémantiquement similaires pour éviter les faux positifs
             */
            function isSemanticallySimilar(word1, word2) {
                // 1. Même préfixe significatif (au moins 4 caractères)
                if (word1.length > 4 && word2.length > 4) {
                    const commonPrefix = findCommonPrefixLength(word1, word2);
                    if (commonPrefix >= 4) return true;
                }

                // 2. Racines similaires après stemming
                const stem1 = fastStemFrench(word1);
                const stem2 = fastStemFrench(word2);
                if (stem1.length > 3 && stem2.length > 3 && stem1 === stem2) {
                    return true;
                }

                // 3. Mots de même famille sémantique
                const semanticFamilies = [
                    ['couleur', 'peinture', 'teinte', 'nuance'],
                    ['garage', 'exterieur', 'facade', 'batiment'],
                    ['maison', 'habitation', 'logement', 'domicile'],
                    ['service', 'prestation', 'travaux', 'intervention'],
                    ['formation', 'cours', 'apprentissage', 'enseignement'],
                    ['contact', 'communication', 'message', 'dialogue'],
                    ['equipe', 'personnel', 'collaborateur', 'employe'],
                    ['produit', 'article', 'materiel', 'equipement'],
                    ['actualite', 'information', 'nouvelle', 'evenement'],
                    ['photo', 'image', 'visuel', 'illustration']
                ];

                for (const family of semanticFamilies) {
                    const word1InFamily = family.some(w => w.includes(word1) || word1.includes(w));
                    const word2InFamily = family.some(w => w.includes(word2) || word2.includes(w));
                    if (word1InFamily && word2InFamily) return true;
                }

                // 4. Rejet des correspondances manifestement incorrectes
                const incompatiblePairs = [
                    ['changer', 'peinture'],
                    ['voir', 'contact'],
                    ['cliquer', 'service'],
                    ['découvrir', 'mention'],
                    ['lire', 'photo'],
                    ['savoir', 'prix']
                ];

                for (const [incompatible1, incompatible2] of incompatiblePairs) {
                    if ((word1.includes(incompatible1) && word2.includes(incompatible2)) ||
                        (word1.includes(incompatible2) && word2.includes(incompatible1))) {
                        return false;
                    }
                }

                return false;
            }

            /**
             * Trouve la longueur du préfixe commun entre deux chaînes
             */
            function findCommonPrefixLength(str1, str2) {
                if (!str1 || !str2) return 0;

                let i = 0;
                const minLength = Math.min(str1.length, str2.length);

                while (i < minLength && str1[i] === str2[i]) {
                    i++;
                }

                return i;
            }

            // ============================================================================
            // 5. FONCTION PRINCIPALE OPTIMISÉE
            // ============================================================================

            /**
             * Vérifie la cohérence entre le texte des liens et leurs pages d'atterrissage
             * VERSION OPTIMISÉE avec toutes les améliorations
             */
            function checkLinkTextRelevanceOptimized() {
                console.log("🚀 Démarrage analyse cohérence liens OPTIMISÉE...");
                console.time("Analyse complète optimisée");

                // Récupérer tous les liens
                let links = [];
                if (window.analyzedLinks && window.analyzedLinks.length > 0) {
                    links = window.analyzedLinks;
                } else {
                    const domLinks = document.querySelectorAll(
                        'a[href]:not([href^="#"]):not([href^="javascript:"]):not([href^="mailto:"]):not([href^="tel:"])'
                    );

                    domLinks.forEach((link) => {
                        links.push({
                            element: link,
                            href: link.getAttribute("href"),
                            text: link.textContent.trim() ||
                                (link.querySelector("img") ?
                                    'ALT: "' + (link.querySelector("img").getAttribute("alt") || "Image sans ALT") + '"' :
                                    "")
                        });
                    });
                }

                // Résultats avec structure identique à l'original
                const results = {
                    coherent: [],
                    incoherent: [],
                    totalChecked: 0,
                    metadata: {
                        menuLinks: 0, ctaLinks: 0, imageLinks: 0, logoLinks: 0, otherLinks: 0,
                        directMatches: 0, semanticMatches: 0, patternMatches: 0, contextualMatches: 0,
                        ctaGenericToSpecific: 0, imageToUnrelatedPage: 0, footerLinksIssues: 0, majorInconsistencies: 0,
                        // Nouvelles métriques optimisées
                        linguisticMatches: 0, fuzzyMatches: 0, cacheHits: 0,
                        // Problèmes d'accessibilité
                        accessibilityIssues: 0
                    },
                    // Métriques de performance
                    performance: {
                        cacheHitRate: 0,
                        avgProcessingTime: 0,
                        totalProcessingTime: 0
                    }
                };

                // Variables de performance
                const startTime = performance.now();
                let totalCacheHits = 0;

                // Analyser chaque lien
                links.forEach((link) => {
                    const linkStartTime = performance.now();
                    results.totalChecked++;

                    const href = link.href;
                    let linkText = link.text;

                    // Classification (logique existante préservée)
                    const isMenuLink = href.includes("Interne au menu");
                    const isCta = href.includes("CTA detecté") || linkText.toUpperCase() === linkText;
                    const isImageLink = linkText.startsWith("ALT:") || href.includes("CTA avec image");

                    if (linkText.startsWith("ALT:")) {
                        linkText = linkText.substring(6, linkText.length - 1);
                    }

                    const isLogo = isProbablyLogoOptimized(link.text, href, isImageLink, isMenuLink);

                    // Mise à jour des métadonnées
                    if (isLogo) results.metadata.logoLinks++;
                    else if (isMenuLink) results.metadata.menuLinks++;
                    else if (isCta) results.metadata.ctaLinks++;
                    else if (isImageLink) results.metadata.imageLinks++;
                    else results.metadata.otherLinks++;

                    const urlInfo = extractPathInfoOptimized(href);

                    let isCoherent = false;
                    let matchReason = "";
                    let matchType = "";
                    let inconsistencyType = "";

                    // Analyse de cohérence optimisée
                    if (!hasSignificantContentOptimized(linkText)) {
                        // Vérifier si l'URL est spécifique ou générique
                        if (isGenericOrEmptyUrl(urlInfo)) {
                            isCoherent = true;
                            matchReason = "Lien sans texte vers page générique";
                            matchType = "defaultCoherent";
                        } else {
                            // URL spécifique sans texte = problème d'accessibilité
                            isCoherent = false;
                            matchReason = "Lien sans texte vers page spécifique";
                            matchType = "accessibilityIssue";
                            inconsistencyType = "Problème d'accessibilité - lien sans texte";
                            results.metadata.majorInconsistencies++;
                        }
                    } else if (isLogo && urlInfo.isHomePage) {
                        isCoherent = true;
                        matchReason = "Logo vers page d'accueil";
                        matchType = "logoHome";
                    } else if (urlInfo.isHomePage && /accueil|home/i.test(normalizeTextOptimized(linkText))) {
                        isCoherent = true;
                        matchReason = 'Texte "accueil/home" vers page d\'accueil';
                        matchType = "homeLink";
                    } else if (isMenuLink) {
                        isCoherent = true;
                        matchReason = "Lien de menu (toujours accepté)";
                        matchType = "menuLink";
                    } else {
                        // ANALYSE SÉMANTIQUE OPTIMISÉE
                        for (const segment of urlInfo.segments) {
                            const coherenceCheck = checkSemanticCoherenceOptimized(linkText, segment);

                            if (coherenceCheck.isCoherent) {
                                isCoherent = true;
                                matchReason = coherenceCheck.reason;
                                matchType = coherenceCheck.matchType || "semantic";

                                // Mise à jour des métriques selon le type de match
                                switch (coherenceCheck.matchType) {
                                    case 'exact':
                                        results.metadata.directMatches++;
                                        break;
                                    case 'semantic_group':
                                        results.metadata.semanticMatches++;
                                        break;
                                    case 'linguistic':
                                        results.metadata.linguisticMatches++;
                                        break;
                                    case 'contextual':
                                        results.metadata.contextualMatches++;
                                        break;
                                    case 'fuzzy':
                                        results.metadata.fuzzyMatches++;
                                        break;
                                    default:
                                        results.metadata.patternMatches++;
                                }
                                break;
                            }
                        }

                        // CTA générique (logique existante)
                        if (!isCoherent && isCta && isGenericCtaOptimized(linkText)) {
                            isCoherent = true;
                            matchReason = "CTA générique accepté";
                            matchType = "genericCta";
                        }
                    }

                    // Gestion des incohérences (logique existante)
                    if (!isCoherent) {
                        if (matchType === "accessibilityIssue") {
                            // Déjà géré dans la logique précédente
                            results.metadata.accessibilityIssues++;
                        } else if (isCta) {
                            inconsistencyType = "CTA non pertinent";
                            results.metadata.ctaGenericToSpecific++;
                        } else if (isImageLink) {
                            inconsistencyType = "Image vers page non reliée";
                            results.metadata.imageToUnrelatedPage++;
                        } else if (urlInfo.path.includes("mentions") || urlInfo.path.includes("privacy") || urlInfo.path.includes("vie")) {
                            inconsistencyType = "Incohérence dans liens de pied de page";
                            results.metadata.footerLinksIssues++;
                        } else {
                            inconsistencyType = "Incohérence majeure";
                            results.metadata.majorInconsistencies++;
                        }
                    }

                    const result = {
                        text: linkText,
                        href: href,
                        path: urlInfo.path,
                        lastSegment: urlInfo.lastSegment,
                        isHomePage: urlInfo.isHomePage,
                        isMenuLink: isMenuLink,
                        isCta: isCta,
                        isImageLink: isImageLink,
                        isLogo: isLogo,
                        matchReason: matchReason,
                        matchType: matchType,
                        inconsistencyType: inconsistencyType,
                        element: link.element
                    };

                    if (isCoherent) {
                        results.coherent.push(result);
                    } else {
                        results.incoherent.push(result);
                    }

                    // Métriques de performance par lien
                    const linkEndTime = performance.now();
                    results.performance.totalProcessingTime += (linkEndTime - linkStartTime);
                });

                // Calcul du score (identique à l'original)
                const consistencyScore = results.coherent.length / results.totalChecked;
                results.score = Math.round(consistencyScore * 100);

                if (results.score >= 90) results.quality = "excellent";
                else if (results.score >= 75) results.quality = "good";
                else if (results.score >= 60) results.quality = "fair";
                else results.quality = "poor";

                // Métriques de performance finales
                const endTime = performance.now();
                results.performance.avgProcessingTime = results.performance.totalProcessingTime / results.totalChecked;
                results.performance.cacheHitRate = ((normalizeCache.cache.size + wordsCache.cache.size + semanticCache.cache.size) / (results.totalChecked * 3)) * 100;

                // Trier les résultats (logique existante)
                results.coherent.sort((a, b) => {
                    if (a.isLogo !== b.isLogo) return b.isLogo ? 1 : -1;
                    if (a.isMenuLink !== b.isMenuLink) return b.isMenuLink ? 1 : -1;
                    if (a.isCta !== b.isCta) return b.isCta ? 1 : -1;
                    return a.path.localeCompare(b.path);
                });

                results.incoherent.sort((a, b) => {
                    if (a.inconsistencyType !== b.inconsistencyType) {
                        if (a.inconsistencyType === "Incohérence majeure") return -1;
                        if (b.inconsistencyType === "Incohérence majeure") return 1;
                    }
                    return a.path.localeCompare(b.path);
                });

                console.timeEnd("Analyse complète optimisée");
                console.log(`✅ Analyse optimisée terminée: ${results.totalChecked} liens analysés`);
                console.log(`   ✓ ${results.coherent.length} liens cohérents (${results.score}%)`);
                console.log(`   ✗ ${results.incoherent.length} liens potentiellement incohérents`);
                console.log(`📊 Nouvelles détections:`);
                console.log(`   ► ${results.metadata.linguisticMatches} correspondances linguistiques`);
                console.log(`   ► ${results.metadata.fuzzyMatches} correspondances approximatives`);
                console.log(`   ► ${results.metadata.contextualMatches} correspondances contextuelles`);
                console.log(`⚡ Performance: ${results.performance.avgProcessingTime.toFixed(2)}ms/lien en moyenne`);

                return results;
            }

            // ============================================================================
            // 6. FONCTIONS UTILITAIRES OPTIMISÉES (versions des fonctions existantes)
            // ============================================================================

            function extractPathInfoOptimized(url) {
                try {
                    let path = url.split("?")[0].split("#")[0];

                    if (path.includes("://")) {
                        path = path.split("://")[1].split("/").slice(1).join("/");
                    }

                    if (path === "" || path === "/") {
                        return { path: "/", lastSegment: "", segments: [], isHomePage: true };
                    }

                    path = "/" + path.replace(/^\/+|\/+$/g, "");
                    const segments = path.split("/").filter(Boolean);
                    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : "";

                    const isHomePage = lastSegment === "" || lastSegment === "index.html" ||
                        lastSegment === "index.php" || lastSegment === "home" || path === "/";

                    return { path, lastSegment, segments, isHomePage };
                } catch (e) {
                    console.error("Erreur lors de l'analyse de l'URL:", url, e);
                    return { path: url, lastSegment: url, segments: [url], isHomePage: false };
                }
            }

            function hasSignificantContentOptimized(text) {
                if (!text) return false;
                const words = extractWordsOptimized(text);
                return words.some(word => word.length > 3);
            }

            /**
             * Détermine si une URL est générique/vide ou spécifique
             * URLs génériques = OK sans texte | URLs spécifiques = problème sans texte
             */
            function isGenericOrEmptyUrl(urlInfo) {
                // Page d'accueil = OK
                if (urlInfo.isHomePage) return true;

                // URLs très courtes ou vides = OK
                if (!urlInfo.path || urlInfo.path === "/" || urlInfo.path.length <= 3) return true;

                // URLs avec seulement un segment court = OK
                if (urlInfo.segments.length === 1 && urlInfo.segments[0].length <= 4) return true;

                // URLs génériques communes = OK
                const genericPaths = [
                    'index', 'home', 'main', 'default', 'accueil',
                    'menu', 'nav', 'navigation', 'page', 'site'
                ];

                const pathLower = urlInfo.path.toLowerCase();
                if (genericPaths.some(generic => pathLower.includes(generic))) return true;

                // URLs avec des identifiants longs ou codes = spécifiques
                const hasLongCode = urlInfo.segments.some(segment =>
                    /\d{6,}/.test(segment) || // 6+ chiffres consécutifs
                    segment.length > 15 ||    // Segment très long
                    /[A-Z]{3,}/.test(segment) // 3+ majuscules (codes)
                );

                if (hasLongCode) return false;

                // Par défaut, considérer comme spécifique si > 1 segment
                return urlInfo.segments.length <= 1;
            }

            function isProbablyLogoOptimized(text, href, isImageLink, isMenuLink) {
                if (!text) return false;
                if (!isImageLink && !isMenuLink) return false;

                const normalizedText = normalizeTextOptimized(text);
                const altText = text.startsWith('ALT: "') ? text.substring(6, text.length - 1) : text;

                const logoKeywords = ['logo', 'brand', 'marque', 'entreprise', 'societe', 'company', 'home', 'accueil'];

                if (altText.length < 3 && isImageLink) return true;

                return logoKeywords.some(keyword => normalizedText.includes(keyword)) ||
                    (isImageLink && isMenuLink && (href.includes("index") || href.includes("accueil") || href.includes("home")));
            }

            function isGenericCtaOptimized(text) {
                if (!text) return false;

                const genericCtas = [
                    "plus d'infos", "plus d'info", "en savoir plus", "voir plus", "lire plus", "lire la suite",
                    "contact", "contactez-nous", "nous contacter", "découvrir", "decouvrir", "explorer",
                    "cliquez ici", "click here", "cliquer ici", "devis", "gratuit", "demander", "demandez",
                    "télécharger", "telecharger", "download", "commander", "acheter", "réserver", "reserver",
                    "consulter", "voir", "visiter"
                ];

                const normalizedText = normalizeTextOptimized(text);
                return genericCtas.some(cta => normalizedText.includes(cta));
            }

            // ============================================================================
            // 7. FONCTION D'AFFICHAGE (IDENTIQUE À L'ORIGINAL)
            // ============================================================================

            function displayLinkRelevanceReportOptimized() {
                const results = checkLinkTextRelevanceOptimized();

                // Supprimer toute instance précédente
                const existingReport = document.getElementById("link-relevance-report");
                if (existingReport) {
                    existingReport.remove();
                }

                // Créer le rapport
                const reportDiv = document.createElement("div");
                reportDiv.id = "link-relevance-report";

                // Dimensions par défaut
                const defaultDimensions = {
                    width: 600,
                    height: 600,
                    minWidth: 400,
                    minHeight: 300,
                    maxWidth: Math.min(1200, window.innerWidth - 40),
                    maxHeight: Math.min(800, window.innerHeight - 40),
                };

                // Style de base avec dimensions
                reportDiv.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #fff; 
            border: 2px solid #333;
            padding: 0; 
            z-index: 9999; 
            width: ${defaultDimensions.width}px;
            height: ${defaultDimensions.height}px;
            min-width: ${defaultDimensions.minWidth}px;
            min-height: ${defaultDimensions.minHeight}px;
            max-width: ${defaultDimensions.maxWidth}px;
            max-height: ${defaultDimensions.maxHeight}px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.3); 
            border-radius: 8px; 
            font-family: Arial, sans-serif;
            user-select: none;
            resize: none;
          `;

                // Structure du rapport avec handles de redimensionnement
                reportDiv.innerHTML = `
            <div id="report-header" style="display: flex; align-items: center; justify-content: space-between; background: #333; color: white; padding: 10px 15px; cursor: move; position: relative;">
              <h3 style="margin: 0; font-size: 16px; pointer-events: none;">🚀 Analyse cohérence liens OPTIMISÉE</h3>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 12px; opacity: 0.8;">v3.0</span>
                <button id="minimize-btn" title="Réduire/Restaurer" style="background: transparent; border: none; color: white; font-size: 16px; cursor: pointer; padding: 2px 5px;">−</button>
                <button id="close-report-btn" title="Fermer" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0;">✕</button>
              </div>
            </div>
            
            <div id="report-content" style="padding: 15px; height: calc(100% - 50px); overflow: hidden; display: flex; flex-direction: column;">
              <!-- Score global avec indicateur de performance -->
              <div style="text-align: center; margin-bottom: 15px; flex-shrink: 0;">
                <div style="position: relative; width: 100px; height: 100px; margin: 0 auto;">
                  <canvas id="score-chart" width="100" height="100"></canvas>
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: bold;">${results.score}%</div>
                </div>
                <div style="margin-top: 5px; font-size: 14px; color: ${getQualityColorOptimized(results.quality)}; font-weight: bold; text-transform: uppercase;">${getQualityLabelOptimized(results.quality)}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #666;">⚡ ${results.performance.avgProcessingTime.toFixed(2)}ms/lien en moyenne</div>
              </div>
              
              <!-- Statistiques principales -->
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 100px; background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold;">${results.totalChecked}</div>
                  <div style="font-size: 12px; color: #666;">Total</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #e8f5e9; padding: 10px; border-radius: 4px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${results.coherent.length}</div>
                  <div style="font-size: 12px; color: #2e7d32;">Cohérents</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #ffebee; padding: 10px; border-radius: 4px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: #f44336;">${results.incoherent.length}</div>
                  <div style="font-size: 12px; color: #c62828;">Incohérents</div>
                </div>
              </div>
              
              <!-- Nouvelles métriques optimisées -->
              <div style="margin-bottom: 15px; flex-shrink: 0;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Détections optimisées</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
                  <div style="display: flex; justify-content: space-between;"><span>🎯 Exactes:</span><span>${results.metadata.directMatches}</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>🧠 Sémantiques:</span><span>${results.metadata.semanticMatches}</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>🔤 Linguistiques:</span><span>${results.metadata.linguisticMatches}</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>📝 Contextuelles:</span><span>${results.metadata.contextualMatches}</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>≈ Approximatives:</span><span>${results.metadata.fuzzyMatches}</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>🔧 Patterns:</span><span>${results.metadata.patternMatches}</span></div>
                </div>
                ${results.metadata.accessibilityIssues > 0 ? `
                  <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <div style="font-size: 12px; color: #856404;">
                      <strong>⚠️ Problèmes d'accessibilité: ${results.metadata.accessibilityIssues}</strong><br>
                      Liens sans texte vers des pages spécifiques
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <!-- Filtres avec nouvelles options -->
              <div style="display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; flex-shrink: 0;">
                <button id="all-links-btn" class="filter-btn" style="background: #2196f3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 13px;">Tous (${results.totalChecked})</button>
                <button id="incoherent-links-btn" class="filter-btn" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 13px;">⚠️ Incohérents (${results.incoherent.length})</button>
                <button id="optimized-links-btn" class="filter-btn" style="background: #4caf50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 13px;">🚀 Nouveaux (${results.metadata.linguisticMatches + results.metadata.fuzzyMatches + results.metadata.contextualMatches})</button>
                <button id="export-csv-btn" class="filter-btn" style="background: #607d8b; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 13px;">📊 CSV</button>
              </div>
              
              <!-- Liste des résultats -->
              <div id="results-container" style="flex: 1; overflow-y: auto; padding-right: 5px;"></div>
            </div>
            
            <!-- Handles de redimensionnement -->
            <div class="resize-handle resize-se" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: se-resize; background: linear-gradient(-45deg, transparent 40%, #999 40%, #999 60%, transparent 60%);"></div>
            <div class="resize-handle resize-s" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 20px; height: 8px; cursor: s-resize;"></div>
            <div class="resize-handle resize-e" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 8px; height: 20px; cursor: e-resize;"></div>
            <div class="resize-handle resize-sw" style="position: absolute; bottom: 0; left: 0; width: 20px; height: 20px; cursor: sw-resize;"></div>
            <div class="resize-handle resize-w" style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 8px; height: 20px; cursor: w-resize;"></div>
            <div class="resize-handle resize-ne" style="position: absolute; top: 50px; right: 0; width: 20px; height: 20px; cursor: ne-resize;"></div>
            <div class="resize-handle resize-n" style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%); width: 20px; height: 8px; cursor: n-resize;"></div>
            <div class="resize-handle resize-nw" style="position: absolute; top: 50px; left: 0; width: 20px; height: 20px; cursor: nw-resize;"></div>
          `;

                document.body.appendChild(reportDiv);

                // Variables et références DOM pour la gestion de l'interface
                let isDragging = false;
                let isResizing = false;
                let dragOffset = { x: 0, y: 0 };
                let resizeData = {
                    handle: null,
                    startX: 0,
                    startY: 0,
                    startWidth: 0,
                    startHeight: 0,
                    startLeft: 0,
                    startTop: 0,
                };
                let isMinimized = false;

                const header = document.getElementById("report-header");
                const content = document.getElementById("report-content");
                const minimizeBtn = document.getElementById("minimize-btn");
                const closeBtn = document.getElementById("close-report-btn");
                const resizeHandles = document.querySelectorAll(".resize-handle");

                // Fonctions utilitaires pour la gestion de fenêtre
                function constrainToScreen(x, y, width, height) {
                    const maxX = window.innerWidth - width;
                    const maxY = window.innerHeight - height;
                    return {
                        x: Math.max(0, Math.min(x, maxX)),
                        y: Math.max(0, Math.min(y, maxY)),
                    };
                }

                function constrainDimensions(width, height) {
                    return {
                        width: Math.max(defaultDimensions.minWidth, Math.min(width, defaultDimensions.maxWidth)),
                        height: Math.max(defaultDimensions.minHeight, Math.min(height, defaultDimensions.maxHeight)),
                    };
                }

                function saveWindowState() {
                    const rect = reportDiv.getBoundingClientRect();
                    const state = {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        isMinimized: isMinimized,
                    };
                    try {
                        sessionStorage.setItem("linkReportWindowState", JSON.stringify(state));
                    } catch (e) {
                        console.warn("Impossible de sauvegarder l'état de la fenêtre:", e);
                    }
                }

                function loadWindowState() {
                    try {
                        const savedState = sessionStorage.getItem("linkReportWindowState");
                        if (savedState) {
                            const state = JSON.parse(savedState);
                            const constrainedDims = constrainDimensions(state.width, state.height);
                            const constrainedPos = constrainToScreen(state.x, state.y, constrainedDims.width, constrainedDims.height);

                            reportDiv.style.left = constrainedPos.x + "px";
                            reportDiv.style.top = constrainedPos.y + "px";
                            reportDiv.style.right = "auto";
                            reportDiv.style.width = constrainedDims.width + "px";
                            reportDiv.style.height = constrainedDims.height + "px";

                            if (state.isMinimized) {
                                setTimeout(() => minimizeBtn.click(), 100);
                            }
                            return true;
                        }
                    } catch (e) {
                        console.warn("Impossible de charger l'état de la fenêtre:", e);
                    }
                    return false;
                }

                // Gestion du redimensionnement
                resizeHandles.forEach((handle) => {
                    handle.addEventListener("mousedown", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isResizing = true;
                        const rect = reportDiv.getBoundingClientRect();

                        resizeData = {
                            handle: handle.classList[1],
                            startX: e.clientX,
                            startY: e.clientY,
                            startWidth: rect.width,
                            startHeight: rect.height,
                            startLeft: rect.left,
                            startTop: rect.top,
                        };

                        reportDiv.style.transition = "none";
                        reportDiv.style.opacity = "0.9";
                        document.body.style.userSelect = "none";
                    });
                });

                document.addEventListener("mousemove", (e) => {
                    if (!isResizing) return;

                    const deltaX = e.clientX - resizeData.startX;
                    const deltaY = e.clientY - resizeData.startY;

                    let newWidth = resizeData.startWidth;
                    let newHeight = resizeData.startHeight;
                    let newLeft = resizeData.startLeft;
                    let newTop = resizeData.startTop;

                    switch (resizeData.handle) {
                        case "resize-se":
                            newWidth = resizeData.startWidth + deltaX;
                            newHeight = resizeData.startHeight + deltaY;
                            break;
                        case "resize-s":
                            newHeight = resizeData.startHeight + deltaY;
                            break;
                        case "resize-e":
                            newWidth = resizeData.startWidth + deltaX;
                            break;
                        case "resize-sw":
                            newWidth = resizeData.startWidth - deltaX;
                            newHeight = resizeData.startHeight + deltaY;
                            newLeft = resizeData.startLeft + deltaX;
                            break;
                        case "resize-w":
                            newWidth = resizeData.startWidth - deltaX;
                            newLeft = resizeData.startLeft + deltaX;
                            break;
                        case "resize-ne":
                            newWidth = resizeData.startWidth + deltaX;
                            newHeight = resizeData.startHeight - deltaY;
                            newTop = resizeData.startTop + deltaY;
                            break;
                        case "resize-n":
                            newHeight = resizeData.startHeight - deltaY;
                            newTop = resizeData.startTop + deltaY;
                            break;
                        case "resize-nw":
                            newWidth = resizeData.startWidth - deltaX;
                            newHeight = resizeData.startHeight - deltaY;
                            newLeft = resizeData.startLeft + deltaX;
                            newTop = resizeData.startTop + deltaY;
                            break;
                    }

                    const constrainedDims = constrainDimensions(newWidth, newHeight);

                    if (newWidth !== constrainedDims.width && resizeData.handle.includes("w")) {
                        newLeft += newWidth - constrainedDims.width;
                    }
                    if (newHeight !== constrainedDims.height && resizeData.handle.includes("n")) {
                        newTop += newHeight - constrainedDims.height;
                    }

                    const constrainedPos = constrainToScreen(newLeft, newTop, constrainedDims.width, constrainedDims.height);

                    reportDiv.style.width = constrainedDims.width + "px";
                    reportDiv.style.height = constrainedDims.height + "px";
                    reportDiv.style.left = constrainedPos.x + "px";
                    reportDiv.style.top = constrainedPos.y + "px";
                    reportDiv.style.right = "auto";
                });

                document.addEventListener("mouseup", () => {
                    if (isResizing) {
                        isResizing = false;
                        reportDiv.style.opacity = "1";
                        reportDiv.style.transition = "all 0.2s ease";
                        document.body.style.userSelect = "";
                        saveWindowState();
                    }
                });

                // Gestion du drag and drop
                header.addEventListener("mousedown", (e) => {
                    if (e.target.tagName === "BUTTON" || isResizing) return;

                    isDragging = true;
                    header.style.cursor = "grabbing";

                    const rect = reportDiv.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;

                    e.preventDefault();

                    reportDiv.style.opacity = "0.9";
                    reportDiv.style.transform = "scale(1.02)";
                    reportDiv.style.transition = "none";
                });

                document.addEventListener("mousemove", (e) => {
                    if (!isDragging || isResizing) return;

                    let newX = e.clientX - dragOffset.x;
                    let newY = e.clientY - dragOffset.y;

                    const rect = reportDiv.getBoundingClientRect();
                    const constrained = constrainToScreen(newX, newY, rect.width, rect.height);

                    reportDiv.style.left = constrained.x + "px";
                    reportDiv.style.top = constrained.y + "px";
                    reportDiv.style.right = "auto";
                });

                document.addEventListener("mouseup", () => {
                    if (isDragging) {
                        isDragging = false;
                        header.style.cursor = "move";

                        reportDiv.style.opacity = "1";
                        reportDiv.style.transform = "scale(1)";
                        reportDiv.style.transition = "all 0.2s ease";

                        saveWindowState();
                    }
                });

                // Fonctions utilitaires pour l'affichage
                function getQualityColorOptimized(quality) {
                    const colors = {
                        excellent: "#4caf50",
                        good: "#8bc34a",
                        fair: "#ffc107",
                        poor: "#f44336"
                    };
                    return colors[quality] || "#607d8b";
                }

                function getQualityLabelOptimized(quality) {
                    const labels = {
                        excellent: "Excellent",
                        good: "Bien",
                        fair: "Moyen",
                        poor: "À améliorer"
                    };
                    return labels[quality] || "Non évalué";
                }

                // Fonction pour dessiner le graphique circulaire du score
                function drawScoreChart(score) {
                    const canvas = document.getElementById("score-chart");
                    if (!canvas) return;

                    const ctx = canvas.getContext("2d");
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const radius = 40;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = "#f5f5f5";
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * score) / 100);
                    ctx.lineTo(centerX, centerY);

                    let color;
                    if (score >= 90) color = "#4caf50";
                    else if (score >= 75) color = "#8bc34a";
                    else if (score >= 60) color = "#ffc107";
                    else color = "#f44336";

                    ctx.fillStyle = color;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
                    ctx.fillStyle = "white";
                    ctx.fill();
                }

                // Fonction de fermeture
                function closeReport() {
                    try {
                        if (reportDiv && reportDiv.parentNode) {
                            if (reportDiv.style.display !== "none" && reportDiv.offsetHeight > 0) {
                                reportDiv.style.transition = "all 0.3s ease";
                                reportDiv.style.transform = "scale(0.9)";
                                reportDiv.style.opacity = "0";

                                setTimeout(() => {
                                    if (reportDiv && reportDiv.parentNode) {
                                        reportDiv.remove();
                                    }
                                }, 300);
                            } else {
                                reportDiv.remove();
                            }
                        }
                    } catch (error) {
                        console.warn("Erreur lors de la fermeture du rapport:", error);
                        if (reportDiv && reportDiv.parentNode) {
                            reportDiv.remove();
                        }
                    }
                }

                // Gestionnaire d'événements pour les filtres et boutons
                reportDiv.addEventListener("click", (e) => {
                    const target = e.target;

                    switch (target.id) {
                        case "close-report-btn":
                            e.preventDefault();
                            e.stopPropagation();
                            closeReport();
                            break;

                        case "minimize-btn":
                            e.preventDefault();
                            e.stopPropagation();
                            isMinimized = !isMinimized;

                            if (isMinimized) {
                                content.style.display = "none";
                                reportDiv.style.height = "50px";
                                minimizeBtn.textContent = "+";
                                minimizeBtn.title = "Restaurer";
                            } else {
                                content.style.display = "flex";
                                const savedState = JSON.parse(sessionStorage.getItem("linkReportWindowState") || "{}");
                                const height = savedState.height || defaultDimensions.height;
                                reportDiv.style.height = height + "px";
                                minimizeBtn.textContent = "−";
                                minimizeBtn.title = "Réduire";
                            }
                            saveWindowState();
                            break;

                        case "all-links-btn":
                            renderLinksOptimized([...results.coherent, ...results.incoherent]);
                            break;
                        case "incoherent-links-btn":
                            renderLinksOptimized(results.incoherent, "incoherent");
                            break;
                        case "optimized-links-btn":
                            const optimizedLinks = [...results.coherent, ...results.incoherent].filter(link =>
                                ['linguistic', 'fuzzy', 'contextual', 'semantic_group'].includes(link.matchType)
                            );
                            renderLinksOptimized(optimizedLinks, "optimized");
                            break;
                        case "export-csv-btn":
                            exportLinkRelevanceResultsCSVOptimized(results);
                            break;
                    }

                    if (target.classList.contains("filter-btn")) {
                        const filterBtns = reportDiv.querySelectorAll(".filter-btn");
                        filterBtns.forEach((btn) => (btn.style.opacity = "0.7"));
                        target.style.opacity = "1";
                    }
                });

                // Fonction de rendu des liens optimisée
                function renderLinksOptimized(links, filter = null) {
                    const container = document.getElementById("results-container");
                    if (!container) return;

                    container.innerHTML = "";

                    if (links.length === 0) {
                        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Aucun lien trouvé</p>';
                        return;
                    }

                    if (filter === "incoherent" && links.length > 0) {
                        const groups = {
                            "Problèmes d'accessibilité": [],
                            "Incohérence majeure": [],
                            "CTA non pertinent": [],
                            "Image vers page non reliée": [],
                            "Incohérence dans liens de pied de page": [],
                        };

                        links.forEach((link) => {
                            if (groups[link.inconsistencyType]) {
                                groups[link.inconsistencyType].push(link);
                            } else {
                                groups["Incohérence majeure"].push(link);
                            }
                        });

                        for (const [groupName, groupLinks] of Object.entries(groups)) {
                            if (groupLinks.length > 0) {
                                const groupTitle = document.createElement("h4");
                                groupTitle.textContent = `${groupName} (${groupLinks.length})`;
                                groupTitle.style.cssText = "margin: 15px 0 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee; font-size: 14px;";
                                container.appendChild(groupTitle);
                                renderLinkList(groupLinks);
                            }
                        }
                    } else {
                        renderLinkList(links);
                    }
                }

                // Fonction pour rendre une liste de liens
                function renderLinkList(links) {
                    const container = document.getElementById("results-container");
                    if (!container) return;

                    const list = document.createElement("ul");
                    list.style.cssText = "list-style: none; padding: 0; margin: 0;";

                    links.forEach((link) => {
                        const item = document.createElement("li");
                        const isCoherent = results.coherent.includes(link);
                        const borderColor = isCoherent ? "#4caf50" : "#f44336";
                        const bgColor = isCoherent ? "#f5f5f5" : "#ffebee";

                        item.style.cssText = `
                padding: 10px; 
                margin-bottom: 10px; 
                background: ${bgColor}; 
                border-radius: 4px; 
                border-left: 4px solid ${borderColor};
                position: relative;
              `;

                        const basic = document.createElement("div");
                        basic.style.marginBottom = "5px";
                        basic.innerHTML = `<strong>${link.text}</strong> → <span style="color: #0277bd;">${link.path}</span>`;

                        const urlDetails = document.createElement("div");
                        urlDetails.style.cssText = "font-size: 12px; word-break: break-all; margin-top: 3px; color: #666; display: none;";
                        urlDetails.innerHTML = link.href;

                        const toggleBtn = document.createElement("button");
                        toggleBtn.textContent = "🔍";
                        toggleBtn.title = "Voir l'URL complète";
                        toggleBtn.style.cssText = "background: none; border: none; font-size: 11px; color: #2196f3; cursor: pointer; padding: 0; margin-left: 5px;";
                        toggleBtn.onclick = () => {
                            urlDetails.style.display = urlDetails.style.display === "none" ? "block" : "none";
                        };

                        basic.appendChild(toggleBtn);

                        if (link.element) {
                            const highlightBtn = document.createElement("button");
                            highlightBtn.textContent = "👁️";
                            highlightBtn.title = "Mettre en évidence ce lien sur la page";
                            highlightBtn.style.cssText = "background: none; border: none; font-size: 11px; color: #9c27b0; cursor: pointer; padding: 0; margin-left: 5px;";
                            highlightBtn.onclick = () => {
                                if (window.highlightedElement) {
                                    window.highlightedElement.style.outline = window.highlightedElementOriginalOutline || "";
                                    window.highlightedElement.style.backgroundColor = window.highlightedElementOriginalBg || "";
                                }

                                window.highlightedElement = link.element;
                                window.highlightedElementOriginalOutline = link.element.style.outline;
                                window.highlightedElementOriginalBg = link.element.style.backgroundColor;

                                link.element.style.outline = "3px solid #f50057";
                                link.element.style.backgroundColor = "rgba(245, 0, 87, 0.1)";

                                link.element.scrollIntoView({ behavior: "smooth", block: "center" });

                                setTimeout(() => {
                                    if (window.highlightedElement) {
                                        window.highlightedElement.style.outline = window.highlightedElementOriginalOutline || "";
                                        window.highlightedElement.style.backgroundColor = window.highlightedElementOriginalBg || "";
                                    }
                                }, 3000);
                            };

                            basic.appendChild(highlightBtn);
                        }

                        const badges = document.createElement("div");
                        badges.style.cssText = "display: flex; gap: 5px; flex-wrap: wrap; margin: 5px 0;";

                        // Badge pour le type de détection (nouveau)
                        if (link.matchType && isCoherent) {
                            const matchTypeBadge = document.createElement("span");
                            const badgeColors = {
                                exact: "#2196f3",
                                semantic_group: "#4caf50",
                                linguistic: "#ff9800",
                                contextual: "#9c27b0",
                                fuzzy: "#795548",
                                logoHome: "#607d8b",
                                homeLink: "#607d8b",
                                menuLink: "#03a9f4",
                                genericCta: "#ff5722"
                            };
                            matchTypeBadge.textContent = link.matchType;
                            matchTypeBadge.style.cssText = `
                  font-size: 10px; 
                  background: ${badgeColors[link.matchType] || "#607d8b"}; 
                  color: white; 
                  padding: 2px 6px; 
                  border-radius: 20px;
                `;
                            badges.appendChild(matchTypeBadge);
                        }

                        // Badge spécial pour les problèmes d'accessibilité
                        if (!isCoherent && link.matchType === "accessibilityIssue") {
                            const accessibilityBadge = document.createElement("span");
                            accessibilityBadge.textContent = "⚠️ Accessibilité";
                            accessibilityBadge.style.cssText = `
                  font-size: 10px; 
                  background: #ffc107; 
                  color: #212529; 
                  padding: 2px 6px; 
                  border-radius: 20px;
                  font-weight: bold;
                `;
                            badges.appendChild(accessibilityBadge);
                        }

                        // Badges existants
                        if (link.isLogo) {
                            const badge = document.createElement("span");
                            badge.textContent = "Logo";
                            badge.style.cssText = "font-size: 11px; background: #4caf50; color: white; padding: 2px 6px; border-radius: 20px;";
                            badges.appendChild(badge);
                        }

                        if (link.isHomePage) {
                            const badge = document.createElement("span");
                            badge.textContent = "Accueil";
                            badge.style.cssText = "font-size: 11px; background: #2196f3; color: white; padding: 2px 6px; border-radius: 20px;";
                            badges.appendChild(badge);
                        }

                        if (link.isMenuLink) {
                            const badge = document.createElement("span");
                            badge.textContent = "Menu";
                            badge.style.cssText = "font-size: 11px; background: #03a9f4; color: white; padding: 2px 6px; border-radius: 20px;";
                            badges.appendChild(badge);
                        }

                        if (link.isCta) {
                            const badge = document.createElement("span");
                            badge.textContent = "CTA";
                            badge.style.cssText = "font-size: 11px; background: #ff9800; color: white; padding: 2px 6px; border-radius: 20px;";
                            badges.appendChild(badge);
                        }

                        if (link.isImageLink && !link.isLogo) {
                            const badge = document.createElement("span");
                            badge.textContent = "Image";
                            badge.style.cssText = "font-size: 11px; background: #9c27b0; color: white; padding: 2px 6px; border-radius: 20px;";
                            badges.appendChild(badge);
                        }

                        const reason = document.createElement("div");
                        reason.style.cssText = "font-size: 12px; color: " + (isCoherent ? "#4caf50" : "#f44336") + ";";
                        reason.textContent = isCoherent ? link.matchReason || "Cohérent" : link.inconsistencyType || "Incohérence détectée";

                        item.appendChild(basic);
                        item.appendChild(urlDetails);
                        if (badges.childNodes.length > 0) {
                            item.appendChild(badges);
                        }
                        item.appendChild(reason);
                        list.appendChild(item);
                    });

                    container.appendChild(list);
                }

                // Fonction d'export CSV optimisée
                function exportLinkRelevanceResultsCSVOptimized(results) {
                    const allLinks = [...results.coherent, ...results.incoherent];
                    let csv = "Texte du lien,URL,Cohérent,Type de détection,Raison\n";

                    allLinks.forEach((link) => {
                        const text = `"${(link.text || "").replace(/"/g, '""')}"`;
                        const href = `"${(link.href || "").replace(/"/g, '""')}"`;
                        const isCoherent = results.coherent.includes(link) ? "Oui" : "Non";
                        const matchType = link.matchType || "standard";
                        const reason = results.coherent.includes(link)
                            ? `"${(link.matchReason || "Cohérent").replace(/"/g, '""')}"`
                            : `"${(link.inconsistencyType || "Incohérent").replace(/"/g, '""')}"`;

                        csv += `${text},${href},${isCoherent},${matchType},${reason}\n`;
                    });

                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const downloadLink = document.createElement("a");
                    downloadLink.setAttribute("href", url);
                    downloadLink.setAttribute("download", "coherence_liens_optimisee_" + new Date().toISOString().slice(0, 10) + ".csv");
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }

                // Restauration de l'état et initialisation
                if (!loadWindowState()) {
                    reportDiv.style.left = "20px";
                    reportDiv.style.top = "20px";
                }

                // Animation d'entrée
                reportDiv.style.transition = "all 0.3s ease";
                reportDiv.style.transform = "scale(0.9)";
                reportDiv.style.opacity = "0";

                requestAnimationFrame(() => {
                    reportDiv.style.transform = "scale(1)";
                    reportDiv.style.opacity = "1";
                });

                // Initialisation
                setTimeout(() => {
                    drawScoreChart(results.score);
                    const incoherentBtn = document.getElementById("incoherent-links-btn");
                    if (incoherentBtn) {
                        incoherentBtn.click();
                    }
                }, 200);

                window.linkRelevanceResults = results;
                return results;
            }

            // ============================================================================
            // 8. LANCEMENT ET INTERFACE
            // ============================================================================

            // Rendre disponible globalement pour tests
            window.checkLinkTextRelevanceOptimized = checkLinkTextRelevanceOptimized;
            window.displayLinkRelevanceReportOptimized = displayLinkRelevanceReportOptimized;

            // Lancement automatique
            displayLinkRelevanceReportOptimized();
        },
    });
};