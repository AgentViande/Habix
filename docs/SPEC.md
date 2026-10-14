# SPEC.md — Spécification fonctionnelle de Habix

> Application web PWA de suivi d'habitudes, 100 % locale (IndexedDB), en français.

---

## 1. Vision produit

Habix est un tracker d'habitudes moderne, offline-first, installable en PWA.
L'utilisateur gère ses habitudes au quotidien, visualise ses progrès via des
streaks et graphiques, et progresse grâce à un système de gamification (XP,
niveaux, badges, titres). Aucune donnée ne quitte l'appareil.

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| **Habitude** | Action récurrente à suivre (ex : « Méditer 10 min ») |
| **Complétion** | Validation d'une habitude pour une date donnée |
| **Streak** | Série de jours/périodes consécutifs où l'habitude est complétée |
| **Jour de gel** | Jour où le streak est préservé sans complétion |
| **Jour de repos** | Jour planifié où l'habitude n'est pas attendue (ne casse pas le streak) |
| **Habitude chiffrée** | Habitude avec objectif numérique (ex : « Boire 2L d'eau ») |
| **Défi** | Programme temporaire de 21 ou 30 jours consécutifs |
| **XP** | Points d'expérience gagnés en complétant des habitudes |
| **Badge** | Récompense débloquée en atteignant un objectif spécifique |
| **Revue hebdo** | Dashboard automatique récapitulant la semaine |

---

## 3. Types d'habitudes

### 3.1 Par validation

| Type | Description | Exemple |
|---|---|---|
| **Binaire** | Fait / pas fait | « Méditer » |
| **Chiffrée** | Valeur numérique avec objectif | « Boire 2L » (objectif = 2, unité = L) |

### 3.2 Par fréquence

| Type | Paramètres | Exemple |
|---|---|---|
| **Quotidienne** | Tous les jours | « Lire 30 min » |
| **Hebdo — jours fixes** | Jours de la semaine sélectionnés | « Sport » → Lun, Mer, Ven |
| **Hebdo — X fois/semaine** | Nombre cible dans la semaine, jours libres | « Courir 3×/semaine » |
| **Intervalle** | Tous les N jours | « Appeler maman tous les 3 jours » |

### 3.3 Propriétés communes

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | `string` (uuid) | ✅ | Identifiant unique |
| `name` | `string` | ✅ | Nom de l'habitude (max 80 car.) |
| `description` | `string` | ❌ | Note explicative |
| `icon` | `string` (emoji) | ✅ | Émoji choisi par l'utilisateur |
| `color` | `string` (hex) | ✅ | Couleur d'accentuation |
| `categoryId` | `string` | ❌ | Catégorie parente |
| `frequencyType` | `enum` | ✅ | `daily` · `weekly_fixed` · `weekly_flex` · `interval` |
| `frequencyConfig` | `object` | ✅ | Config selon le type (voir §3.2) |
| `targetType` | `enum` | ✅ | `boolean` · `numeric` |
| `targetValue` | `number` | Si chiffrée | Objectif numérique |
| `targetUnit` | `string` | Si chiffrée | Unité (L, min, km…) |
| `difficulty` | `enum` | ✅ | `easy` · `medium` · `hard` — influe sur l'XP |
| `reminderTime` | `string` (HH:mm) | ❌ | Heure de rappel |
| `restDays` | `number[]` | ❌ | Jours de repos (0=dim … 6=sam) |
| `isArchived` | `boolean` | ✅ | Habitude archivée (masquée du dashboard) |
| `createdAt` | `Date` | ✅ | Date de création |
| `sortOrder` | `number` | ✅ | Ordre d'affichage |

---

## 4. Catégories

L'utilisateur organise ses habitudes en catégories personnalisées.

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `name` | `string` | Nom (ex : « Santé », « Productivité ») |
| `icon` | `string` | Émoji |
| `color` | `string` | Couleur |
| `sortOrder` | `number` | Ordre d'affichage |

Catégories pré-créées au premier lancement : Santé 💪, Mental 🧠, Productivité 📈,
Social 👥, Créativité 🎨, Finance 💰.

L'utilisateur peut en créer, modifier, supprimer (les habitudes orphelines passent
en « Sans catégorie »).

---

## 5. Complétion et saisie

### 5.1 Complétion binaire

- Tap / clic sur l'habitude → bascule fait/non fait.
- Animation de check satisfaisante (micro-interaction).

### 5.2 Complétion chiffrée

- Tap court : +1 à la valeur (incrément rapide).
- Tap long / clic : ouvre un champ de saisie numérique.
- Barre de progression circulaire autour de l'icône.
- Complétion considérée quand `valeur >= targetValue`.

### 5.3 Saisie rétroactive

- L'utilisateur peut modifier une complétion jusqu'à **N jours en arrière**,
  N étant configurable dans les paramètres (défaut : 7, plage 1-30).
- La date rétroactive est visuellement marquée (badge « rétroactif »).
- L'XP est recalculé ; le streak est mis à jour en conséquence.

### 5.4 Modèle de données — Complétion

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `habitId` | `string` | Habitude associée |
| `date` | `string` (YYYY-MM-DD) | Date locale de la complétion |
| `value` | `number` | 1 (binaire) ou valeur chiffrée |
| `isRetroactive` | `boolean` | Marqueur de saisie rétroactive |
| `completedAt` | `Date` | Timestamp réel de la saisie |

---

## 6. Streaks

> Règles détaillées dans [STREAK_RULES.md](./STREAK_RULES.md).

### 6.1 Affichage

- **Streak courant** : nombre affiché en gros sur chaque carte d'habitude + icône
  🔥 animée.
- **Meilleur streak** : record historique affiché dans les stats de l'habitude.
- **Calendrier heatmap** : grille annuelle colorée (vert=complété, bleu=gel,
  gris=repos, rouge=manqué).

### 6.2 Jours de gel

- Illimités (pas de limite mensuelle).
- L'utilisateur peut geler **le jour courant** ou **un jour passé** (dans la
  fenêtre de rétroactivité).
- Un jour gelé conserve le streak mais ne l'incrémente pas.
- Visuel distinct dans le calendrier (icône ❄️, couleur bleue).

### 6.3 Jours de repos

- Définis lors de la création de l'habitude (jours de la semaine).
- Les jours de repos sont ignorés dans le calcul du streak.
- Ils n'apparaissent pas comme « manqués » dans le calendrier.

---

## 7. Gamification — XP, Niveaux, Badges, Titres

### 7.1 XP (Points d'expérience)

#### Gain de base par complétion

| Difficulté | XP de base |
|---|---|
| Facile | 10 XP |
| Moyen | 20 XP |
| Difficile | 35 XP |

#### Multiplicateurs

| Condition | Multiplicateur |
|---|---|
| Streak 7+ jours | ×1.5 |
| Streak 30+ jours | ×2.0 |
| Streak 100+ jours | ×3.0 |
| Complétion avant 9h | ×1.2 (bonus « lève-tôt ») |
| 100% habitudes du jour | +50 XP bonus « journée parfaite » |

Les multiplicateurs se cumulent (multiplicativement).

#### Pénalités

- Aucune pénalité en XP pour un jour manqué (on encourage, on ne punit pas).
- Le gel ne donne pas d'XP.

### 7.2 Niveaux

- Formule : `XP requis pour niveau N = 100 × N^1.5` (arrondi).
- Niveau max : 99.
- Barre de progression XP visible en permanence dans le header.
- Animation de level-up (confettis + notification).

| Niveau | XP cumulé requis |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 5 | 1 118 |
| 10 | 4 641 |
| 25 | 31 250 |
| 50 | 141 421 |
| 99 | 489 951 |

### 7.3 Badges

Organisés en catégories (arbre de badges). ~35 badges au lancement.

#### Catégorie : Streaks 🔥

| Badge | Condition | Icône |
|---|---|---|
| Première flamme | Premier streak de 3 jours | 🕯️ |
| Semaine de feu | Streak de 7 jours | 🔥 |
| Mois incandescent | Streak de 30 jours | 🌋 |
| Trimestre de braise | Streak de 90 jours | ☄️ |
| Année infernale | Streak de 365 jours | 🌟 |

#### Catégorie : Complétion ✅

| Badge | Condition | Icône |
|---|---|---|
| Premier pas | 1ère complétion | 👣 |
| Centurion | 100 complétions totales | 🏛️ |
| Millionnaire | 1 000 complétions totales | 💎 |
| Marathonien | 10 000 complétions totales | 🏅 |

#### Catégorie : Régularité 📊

| Badge | Condition | Icône |
|---|---|---|
| Semaine parfaite | 100% complétion sur 7 jours | ⭐ |
| Mois parfait | 100% complétion sur 30 jours | 🌙 |
| Lève-tôt | 50 complétions avant 9h | 🌅 |
| Oiseau de nuit | 50 complétions après 22h | 🦉 |

#### Catégorie : Diversité 🌈

| Badge | Condition | Icône |
|---|---|---|
| Touche-à-tout | 5 habitudes actives simultanément | 🎯 |
| Polymorphe | Habitudes dans 4 catégories différentes | 🦎 |
| Collectionneur | 10 habitudes créées | 📚 |

#### Catégorie : Gamification 🎮

| Badge | Condition | Icône |
|---|---|---|
| Niveau 5 | Atteindre le niveau 5 | 🥉 |
| Niveau 10 | Atteindre le niveau 10 | 🥈 |
| Niveau 25 | Atteindre le niveau 25 | 🥇 |
| Niveau 50 | Atteindre le niveau 50 | 👑 |
| Défi relevé | Terminer un défi 21 jours | 🏆 |
| Défi ultime | Terminer un défi 30 jours | 🎖️ |

#### Catégorie : Humeur 😊

| Badge | Condition | Icône |
|---|---|---|
| Introspection | 7 jours consécutifs de suivi humeur | 🪞 |
| Journal intime | 30 jours de suivi humeur | 📖 |

### 7.4 Titres

Libellé affiché sous le nom de l'utilisateur, choisi parmi les titres débloqués.

| Titre | Condition |
|---|---|
| Débutant motivé | Niveau 1 (défaut) |
| Habitué(e) | Niveau 5 |
| Discipliné(e) | Niveau 10 |
| Maître des habitudes | Niveau 25 |
| Légende vivante | Niveau 50 |
| Ascète | Streak 100+ jours sur une habitude difficile |
| Perfectionniste | 4 semaines parfaites consécutives |

---

## 8. Humeur quotidienne

### 8.1 Saisie

- Pop-up optionnel au premier lancement de la journée (ou accessible via bouton).
- 5 niveaux d'émoji : 😢 😔 😐 😊 😄
- Tags prédéfinis (multi-sélection) : `stressé`, `motivé`, `fatigué`, `heureux`,
  `anxieux`, `calme`, `productif`, `créatif`, `social`, `solitaire`.
- Tags personnalisés (l'utilisateur peut en ajouter).
- Note libre optionnelle (max 500 car.).

### 8.2 Modèle de données

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `date` | `string` (YYYY-MM-DD) | Date |
| `level` | `1-5` | Niveau d'humeur |
| `tags` | `string[]` | Tags sélectionnés |
| `note` | `string` | Note libre |
| `createdAt` | `Date` | Timestamp |

### 8.3 Visualisation

- Graphe d'humeur sur 7 / 30 / 90 jours (courbe lissée).
- Corrélation humeur ↔ taux de complétion (overlay sur le graphe).
- Nuage de tags (fréquence).

---

## 9. Défis 21/30 jours

### 9.1 Concept

Un défi est un engagement intensif : compléter une habitude spécifique pendant 21
ou 30 jours **consécutifs** (les jours de repos ne comptent pas comme interruption,
mais les jours de gel n'allongent pas non plus le défi).

### 9.2 Propriétés

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `habitId` | `string` | Habitude ciblée |
| `duration` | `21 \| 30` | Durée du défi |
| `startDate` | `string` | Date de début |
| `currentDay` | `number` | Jour courant du défi (1-based) |
| `status` | `enum` | `active` · `completed` · `failed` · `abandoned` |
| `completedAt` | `Date?` | Date de complétion |

### 9.3 Règles

- **1 seul défi actif par habitude** à la fois.
- Plusieurs défis simultanés sur des habitudes différentes : OK.
- Un jour manqué (sans gel) → défi **échoué**.
- Un jour de gel → le compteur est suspendu (ne compte ni comme jour complété ni
  comme échec). Le défi reprend au prochain jour actif.
- Complétion → badge + XP bonus (100 XP pour 21j, 200 XP pour 30j).
- L'utilisateur peut abandonner un défi à tout moment.

---

## 10. Revue hebdomadaire

Dashboard auto-généré chaque lundi (ou configurable) affichant :

| Section | Contenu |
|---|---|
| **Score global** | Taux de complétion de la semaine (%) avec comparaison S-1 |
| **Habitudes performantes** | Top 3 habitudes les mieux suivies |
| **Habitudes en difficulté** | Les 3 habitudes les moins suivies |
| **Streaks** | Évolution des streaks (progression / régression) |
| **XP & Niveau** | XP gagnés cette semaine, progression de niveau |
| **Humeur** | Courbe d'humeur de la semaine |
| **Badges** | Badges débloqués cette semaine |
| **Défis** | Progression des défis en cours |

- Accessible via un onglet « Revue » ou une notification in-app le jour configuré.
- Historique des revues passées consultable.

---

## 11. Rappels et Notifications

### 11.1 Notifications navigateur (Push via Service Worker)

- L'utilisateur définit une heure de rappel par habitude.
- Le Service Worker programme les notifications locales.
- Format : « 🔔 N'oublie pas : [nom habitude] ! »
- Permission demandée au premier rappel configuré.

### 11.2 Rappels in-app

- **Bannière persistante** au lancement si des habitudes du jour ne sont pas
  complétées : « Il te reste 3 habitudes aujourd'hui ! ».
- **Badge numérique** sur l'icône de l'onglet « Aujourd'hui » indiquant le nombre
  d'habitudes restantes.
- **Rappel de soirée** (configurable, défaut 21h) : bannière « Dernière ligne
  droite ! X habitudes non complétées ».

---

## 12. Export / Import

### 12.1 Export JSON

- Bouton « Exporter mes données » dans les paramètres.
- Exporte **toute** la base IndexedDB en un fichier JSON structuré :
  - Métadonnées (version du schéma, date d'export).
  - Habitudes, catégories, complétions, humeurs, défis, badges débloqués, profil.
- Nom du fichier : `habix-export-YYYY-MM-DD.json`.

### 12.2 Import JSON

- Bouton « Importer des données ».
- Validation du schéma avant import.
- 2 modes :
  - **Remplacement total** : écrase toutes les données existantes.
  - **Fusion** : merge intelligent (les habitudes existantes sont mises à jour, les
    nouvelles sont ajoutées, les complétions sont fusionnées par date+habitId).
- Confirmation avec résumé avant application (« 12 habitudes, 340 complétions,
  5 badges… »).

---

## 13. Paramètres utilisateur

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `displayName` | `string` | « Utilisateur » | Nom affiché |
| `theme` | `enum` | `system` | `light` · `dark` · `system` |
| `retroactiveDays` | `number` | 7 | Fenêtre de rétroactivité (1-30) |
| `weekStartDay` | `enum` | `monday` | Premier jour de la semaine |
| `reviewDay` | `enum` | `monday` | Jour de la revue hebdomadaire |
| `eveningReminderTime` | `string` | `21:00` | Heure du rappel de soirée |
| `showMoodPopup` | `boolean` | `true` | Pop-up humeur au lancement |
| `selectedTitle` | `string` | Dernier débloqué | Titre affiché |
| `timezone` | `string` | Auto-détecté | Fuseau horaire |

---

## 14. Profil utilisateur

Écran « Mon profil » affichant :

- Nom + titre sélectionné.
- Niveau + barre XP.
- Statistiques globales : nombre d'habitudes actives, complétions totales, meilleur
  streak tous temps, jours d'utilisation.
- Galerie de badges (débloqués en couleur, verrouillés en grisé avec condition).
- Sélecteur de titre parmi ceux débloqués.

---

## 15. Navigation et écrans

| Écran | Route | Description |
|---|---|---|
| Aujourd'hui | `/` | Dashboard du jour : liste des habitudes, progression |
| Calendrier | `/calendar` | Vue calendrier heatmap par habitude |
| Statistiques | `/stats` | Graphiques Recharts (complétion, streaks, humeur) |
| Revue hebdo | `/review` | Dashboard de la semaine |
| Défis | `/challenges` | Liste et détails des défis |
| Profil | `/profile` | Profil, badges, titres |
| Paramètres | `/settings` | Configuration |
| Détail habitude | `/habit/:id` | Stats détaillées d'une habitude |

Navigation principale : barre de navigation en bas (mobile) / sidebar (desktop).

---

## 16. PWA

- **Manifest** : nom, icônes (192, 512), couleur thème, `display: standalone`.
- **Service Worker** : stratégie cache-first pour les assets, notifications
  programmées.
- **Installabilité** : bannière d'installation native + bouton dans les paramètres.
- **Offline** : fonctionne intégralement hors connexion.

---

## 17. Contraintes non fonctionnelles

| Contrainte | Cible |
|---|---|
| **Performance** | First Contentful Paint < 1.5s, TTI < 3s |
| **Accessibilité** | WCAG 2.1 AA (contrastes, focus, aria-labels) |
| **Responsive** | Mobile-first, breakpoints : 640 / 768 / 1024 / 1280 px |
| **Stockage** | IndexedDB via Dexie.js, pas de limite pratique |
| **Navigateurs** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Taille bundle** | < 300 KB gzippé (hors polices) |
