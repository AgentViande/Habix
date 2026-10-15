export interface QuoteOrTip {
  texte: string;
  auteur?: string;
  type: 'citation' | 'conseil';
}

export const QUOTES_AND_TIPS: QuoteOrTip[] = [
  // --- CITATIONS DE DOMAINE PUBLIC ---
  {
    texte:
      'Nous sommes ce que nous répétons sans cesse. L’excellence n’est donc pas un acte, mais une habitude.',
    auteur: 'Aristote',
    type: 'citation',
  },
  {
    texte: 'Un voyage de mille lieues commence toujours par un premier pas.',
    auteur: 'Lao Tseu',
    type: 'citation',
  },
  {
    texte:
      'Ce n’est pas parce que les choses sont difficiles que nous n’osons pas, c’est parce que nous n’osons pas qu’elles sont difficiles.',
    auteur: 'Sénèque',
    type: 'citation',
  },
  {
    texte:
      'Que la force me soit donnée de supporter ce qui ne peut être changé et le courage de changer ce qui peut l’être.',
    auteur: 'Marc Aurèle',
    type: 'citation',
  },
  {
    texte: 'La goutte de pluie perce le roc, non par sa force, mais par sa persévérance.',
    auteur: 'Lucrèce',
    type: 'citation',
  },
  {
    texte: 'Celui qui déplace une montagne commence par déplacer de petites pierres.',
    auteur: 'Confucius',
    type: 'citation',
  },
  {
    texte: 'N’attendez pas d’être parfait pour commencer quelque chose de bien.',
    auteur: 'Abbé Pierre',
    type: 'citation',
  },
  {
    texte: 'La discipline est le pont entre les objectifs et les accomplissements.',
    auteur: 'Proverbe',
    type: 'citation',
  },
  {
    texte:
      'Hâte-toi lentement et sans perdre courage, vingt fois sur le métier remettez votre ouvrage.',
    auteur: 'Nicolas Boileau',
    type: 'citation',
  },
  {
    texte:
      'Le secret du changement consiste à concentrer son énergie non pas à lutter contre le passé, mais à construire l’avenir.',
    auteur: 'Socrate',
    type: 'citation',
  },
  {
    texte: 'Ne mesurez pas votre succès à ce que vous récoltez, mais aux graines que vous semez.',
    auteur: 'Robert Louis Stevenson',
    type: 'citation',
  },
  {
    texte: 'Ce que nous faisons chaque jour détermine qui nous deviendrons demain.',
    auteur: 'Épictète',
    type: 'citation',
  },
  {
    texte: 'Un fleuve traverse les rochers non par sa puissance, mais par sa constance.',
    auteur: 'Proverbe latin',
    type: 'citation',
  },
  {
    texte: 'L’arbre le plus grand a poussé d’un germe minuscule.',
    auteur: 'Lao Tseu',
    type: 'citation',
  },
  {
    texte: 'Rien de grand ne s’est accompli dans le monde sans passion ni patience.',
    auteur: 'Georg Wilhelm Friedrich Hegel',
    type: 'citation',
  },
  {
    texte: 'Il n’y a point de chemin trop long à l’homme qui marche sans se presser.',
    auteur: 'Jean de La Bruyère',
    type: 'citation',
  },
  {
    texte: 'Prends soin de tes habitudes, elles deviendront ton destin.',
    auteur: 'Mahatma Gandhi',
    type: 'citation',
  },
  {
    texte:
      'Vivre, ce n’est pas attendre que l’orage passe, c’est apprendre à danser sous la pluie.',
    auteur: 'Sénèque',
    type: 'citation',
  },
  {
    texte: 'Le commencement est la moitié de toute action.',
    auteur: 'Platon',
    type: 'citation',
  },
  {
    texte: 'Chaque pas en avant est une victoire sur la stagnation.',
    auteur: 'Confucius',
    type: 'citation',
  },
  {
    texte: 'Ce qui ne nous tue pas nous rend plus fort.',
    auteur: 'Friedrich Nietzsche',
    type: 'citation',
  },
  {
    texte: 'Mieux vaut allumer une petite chandelle que de maudire l’obscurité.',
    auteur: 'Confucius',
    type: 'citation',
  },
  {
    texte: 'Ne compte pas les jours, fais en sorte que les jours comptent.',
    auteur: 'Muhammad Ali',
    type: 'citation',
  },
  {
    texte: 'Le sage agit sans rien attendre et accomplit son œuvre sans s’y attacher.',
    auteur: 'Lao Tseu',
    type: 'citation',
  },
  {
    texte:
      'La vraie gloire consiste à faire ce qui mérite d’être écrit et d’écrire ce qui mérite d’être lu.',
    auteur: 'Pline le Jeune',
    type: 'citation',
  },
  {
    texte: 'Tout ce qui arrive arrive avec justice, tu le trouveras si tu y prends garde.',
    auteur: 'Marc Aurèle',
    type: 'citation',
  },
  {
    texte: 'La patience a beaucoup plus de pouvoir que la force brutale.',
    auteur: 'Plutarque',
    type: 'citation',
  },
  {
    texte: 'Le fer se rouille faute de s’en servir, ainsi s’engourdit l’esprit sans exercice.',
    auteur: 'Léonard de Vinci',
    type: 'citation',
  },
  {
    texte: 'La seule limite à notre épanouissement de demain sera nos doutes d’aujourd’hui.',
    auteur: 'Franklin D. Roosevelt',
    type: 'citation',
  },
  {
    texte: 'Petits ruisseaux font les grandes rivières.',
    auteur: 'Proverbe populaire',
    type: 'citation',
  },
  {
    texte: 'Il n’y a qu’une façon d’échouer, c’est d’abandonner avant d’avoir réussi.',
    auteur: 'Georges Clemenceau',
    type: 'citation',
  },
  {
    texte:
      'La persévérance est la vertu par laquelle toutes les autres vertus portent leurs fruits.',
    auteur: 'Arturo Graf',
    type: 'citation',
  },
  {
    texte: 'Fais de chaque jour ton chef-d’œuvre.',
    auteur: 'John Wooden',
    type: 'citation',
  },
  {
    texte: 'Tout paraît toujours impossible jusqu’à ce que ce soit fait.',
    auteur: 'Nelson Mandela',
    type: 'citation',
  },
  {
    texte: 'Le secret pour avancer est tout simplement de commencer.',
    auteur: 'Mark Twain',
    type: 'citation',
  },

  // --- CONSEILS ORIGINAUX SUR LES HABITUDES ---
  {
    texte:
      'Règle des deux minutes : réduisez votre nouvelle habitude à une action qui prend moins de 120 secondes pour commencer sans friction.',
    type: 'conseil',
  },
  {
    texte:
      'Empilement d’habitudes : attachez votre nouvelle action à une habitude déjà bien ancrée, par exemple juste après votre café du matin.',
    type: 'conseil',
  },
  {
    texte:
      'Ne manquez jamais deux fois : si vous sautez une habitude aujourd’hui, faites-en votre priorité absolue dès demain.',
    type: 'conseil',
  },
  {
    texte:
      'La régularité prime sur l’intensité : faire 5 minutes chaque jour bâtit plus de confiance que 2 heures une fois par mois.',
    type: 'conseil',
  },
  {
    texte:
      'Préparez le terrain la veille : laissez votre livre ouvert, votre gourde remplie ou votre tapis déroulé pour réduire la friction au réveil.',
    type: 'conseil',
  },
  {
    texte:
      'Célébrez les micro-victoires : chaque coche dans Habix libère une dose de satisfaction qui renforce le circuit neuronal de l’habitude.',
    type: 'conseil',
  },
  {
    texte:
      'Concentrez-vous sur l’identité : ne dites pas "j’essaie de méditer", dites "je suis quelqu’un qui prend soin de son calme intérieur".',
    type: 'conseil',
  },
  {
    texte:
      'Réduisez l’effort de démarrage : le plus dur est souvent d’enfiler ses baskets ou d’ouvrir le document, pas l’activité elle-même.',
    type: 'conseil',
  },
  {
    texte:
      'Protégez votre énergie matinale : réalisez votre habitude la plus exigeante avant que les sollicitations extérieures ne commencent.',
    type: 'conseil',
  },
  {
    texte:
      'Utilisez vos jours de gel avec discernement : ils sont là pour protéger votre élan lors des imprévus, pas pour procrastiner.',
    type: 'conseil',
  },
  {
    texte:
      'Mesurez le progrès, pas la perfection : une semaine à 80% est une immense victoire comparée à l’abandon.',
    type: 'conseil',
  },
  {
    texte:
      'Associez plaisir et effort : écoutez votre podcast favori uniquement pendant que vous rangez ou faites votre séance de sport.',
    type: 'conseil',
  },
  {
    texte:
      'Évitez le piège du tout ou rien : 2 pompes valent infiniment mieux que 0 pompe un jour de fatigue.',
    type: 'conseil',
  },
  {
    texte:
      'Identifiez vos déclencheurs : une heure fixe ou un lieu dédié transforment une intention vague en réflexe automatique.',
    type: 'conseil',
  },
  {
    texte:
      'Notez votre humeur : observez comment la validation de vos habitudes influence positivement votre niveau d’énergie en fin de journée.',
    type: 'conseil',
  },
  {
    texte:
      'Faites de la visibilité votre alliée : gardez Habix ouvert ou sur votre écran d’accueil pour que vos priorités restent en tête.',
    type: 'conseil',
  },
  {
    texte:
      'Le repos fait partie de l’entraînement : planifier des jours de repos pour les habitudes exigeantes évite la lassitude et les blessures.',
    type: 'conseil',
  },
  {
    texte:
      'Soyez bienveillant avec vous-même : un faux pas est une information, pas un échec définitif.',
    type: 'conseil',
  },
  {
    texte:
      'Clarifiez le "Pourquoi" : quand la motivation faiblit, rappelez-vous pour quelle raison profonde vous avez instauré cette habitude.',
    type: 'conseil',
  },
  {
    texte:
      'Simplifiez au maximum : si une habitude vous paraît insurmontable, découpez-la en sous-étapes jusqu’à ce qu’elle devienne facile.',
    type: 'conseil',
  },
  {
    texte:
      'La constance crée la liberté : automatiser les tâches saines libère de l’espace mental pour la créativité et les loisirs.',
    type: 'conseil',
  },
  {
    texte:
      'Surveillez votre dialogue interne : remplacez "je dois le faire" par "je choisis de le faire pour mon bien-être".',
    type: 'conseil',
  },
  {
    texte:
      'La récompense immédiate : après une habitude difficile, offrez-vous un moment agréable pour ancrer le sentiment d’accomplissement.',
    type: 'conseil',
  },
  {
    texte:
      'La règle du premier domino : commencez par l’habitude clé qui facilite toutes les autres (souvent le sommeil ou l’hydratation).',
    type: 'conseil',
  },
  {
    texte:
      'Le temps passe de toute façon : dans un an, vous auriez aimé avoir commencé aujourd’hui.',
    type: 'conseil',
  },
  {
    texte:
      'Les séries longues se construisent un jour à la fois : ne pensez pas aux 100 jours, pensez seulement à la coche d’aujourd’hui.',
    type: 'conseil',
  },
  {
    texte:
      'Adaptez sans abandonner : s’il pleut pour votre course, faites 15 minutes d’étirements ou de corde à sauter à la maison.',
    type: 'conseil',
  },
  {
    texte:
      'Écoutez votre corps : adapter le volume d’un objectif numérique selon la fatigue du jour préserve la longévité de l’habitude.',
    type: 'conseil',
  },
  {
    texte:
      'Un rituel du soir efficace prépare un matin victorieux : coupez les écrans 30 minutes avant de dormir.',
    type: 'conseil',
  },
  {
    texte:
      'Vos habitudes définissent votre futur : chaque action d’aujourd’hui est un vote pour la personne que vous souhaitez devenir.',
    type: 'conseil',
  },
];

/**
 * Deterministically computes the quote index for a given YYYY-MM-DD date string.
 * Guarantees the same quote throughout the day across reloads and offline.
 */
export function getDailyQuoteIndex(
  dateStr: string,
  total: number = QUOTES_AND_TIPS.length
): number {
  if (!dateStr || total <= 0) return 0;
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;

  const [year, month, day] = parts;
  // Julian-style days computation for rock-solid stability
  const days = Math.floor(year * 365.25) + Math.floor(month * 30.6) + day;
  return ((days % total) + total) % total;
}

export function getDailyQuote(dateStr: string): { quote: QuoteOrTip; index: number } {
  const index = getDailyQuoteIndex(dateStr, QUOTES_AND_TIPS.length);
  return {
    quote: QUOTES_AND_TIPS[index],
    index,
  };
}

export function getRandomQuote(excludeIndex?: number): { quote: QuoteOrTip; index: number } {
  const total = QUOTES_AND_TIPS.length;
  if (total <= 1) return { quote: QUOTES_AND_TIPS[0], index: 0 };

  let nextIndex = Math.floor(Math.random() * total);
  if (nextIndex === excludeIndex) {
    nextIndex = (nextIndex + 1) % total;
  }
  return {
    quote: QUOTES_AND_TIPS[nextIndex],
    index: nextIndex,
  };
}
