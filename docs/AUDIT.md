# 📋 Audit Complet — Habix v1.0.8

**Date de l'audit** : 15 octobre 2026  
**Application** : Habix — Tracker d'habitudes moderne et RPG gamifié (100% local, Electron + React + TypeScript + Dexie)  
**Périmètre** : Code source complet (`src/`, `electron/`, `scripts/`, configuration, dépendances).  
**Règle absolue** : Cet audit est réalisé **sans aucune modification du code source**.

---

## 📑 Synthèse Globale

| Gravité | Nombre d'anomalies | Impact principal |
| :--- | :---: | :--- |
| 🔴 **Critique** | **6** | Conditions de course (XP infini), blocage de gain d'XP à minuit, échec d'import JSON, absence de CSP, navigation Electron non interceptée, crash blanc sans ErrorBoundary. |
| 🟡 **Important** | **8** | Formule de niveau fausse sur ProfilePage, démultiplication d'XP dans DailyXPRecap, doublon de modal badges, exploit progression défis, jours de repos ignorés, interrupteur d'animations ignoré pour les confettis, scripts orphelins. |
| 🟢 **Mineur** | **6** | Décalages potentiels UTC, nettoyage nœuds audio, écouteur thème système dynamique, optimisation des tris et requêtes, consolidation des logs console. |

---

## 🔴 1. Problèmes Critiques

### BUG-CRIT-01 — Condition de course sur cochage rapide (Double Clic) et duplication d'XP
* **Axe** : a. Bugs de logique & performance
* **Fichier** : [`src/pages/TodayPage.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/pages/TodayPage.tsx#L166-L220)
* **Lignes** : 166–220
* **Explication** : `handleToggle` est une fonction asynchrone non verrouillée. Si l'utilisateur clique rapidement deux fois sur le bouton de complétion d'une habitude, les deux appels s'exécutent en parallèle avec la même fermeture d'état React (`completions`). Les deux vérifications `isHabitAwardedToday(habit.id)` renvoient `false` simultanément avant que le premier appel à `addXP` n'ait persisté l'événement dans `db.xpEvents`. Cela entraîne une double attribution d'XP, un calcul erroné des streaks et une incohérence d'état dans IndexedDB.
* **Correction proposée** :
  1. Instancier un `useRef(new Set<string>())` pour enregistrer les `habitId` en cours de traitement asynchrone (`pendingToggles`).
  2. Si `pendingToggles.current.has(habit.id)`, ignorer immédiatement le clic.
  3. Libérer le verrou dans un bloc `finally`.

---

### BUG-CRIT-02 — Blocage de l'attribution d'XP au passage de minuit (Midnight Rollover)
* **Axe** : a. Bugs de logique (dates & XP)
* **Fichier** : [`src/stores/useGamificationStore.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/stores/useGamificationStore.ts#L81-L105) et [`src/stores/useGamificationStore.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/stores/useGamificationStore.ts#L118-L142)
* **Lignes** : 81–105 et 118–142
* **Explication** : `todayAwardedHabitIds` est un tableau de chaînes initialisé une seule fois au démarrage par `loadGamification()`. Si l'application reste ouverte et que minuit passe :
  - `today` sur la page Aujourd'hui change pour la nouvelle date.
  - Cependant, `todayAwardedHabitIds` dans le store conserve les identifiants de la veille.
  - La méthode `isHabitAwardedToday: (habitId) => get().todayAwardedHabitIds.includes(habitId)` ne compare pas la date calendaire !
  - En conséquence, toute habitude réalisée la veille est considérée comme déjà récompensée aujourd'hui. L'utilisateur ne gagne **aucun XP** le lendemain tant qu'il ne redémarre pas l'application.
* **Correction proposée** :
  1. Ajouter un champ `todayAwardedDate: string` dans l'état de `GamificationStoreState`.
  2. Dans `isHabitAwardedToday` et `addXP`, si la date actuelle diffère de `todayAwardedDate`, réinitialiser et recharger automatiquement `todayAwardedHabitIds` pour la nouvelle journée.

---

### BUG-CRIT-03 — Échec fatal de la restauration JSON en cas de doublons (ConstraintError)
* **Axe** : b. Données (export/import JSON)
* **Fichier** : [`src/services/import-export.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/services/import-export.ts#L107-L164) et [`src/pages/SettingsPage.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/pages/SettingsPage.tsx#L229-L239)
* **Lignes** : 107–164 (`import-export.ts`) et 229–239 (`SettingsPage.tsx`)
* **Explication** : `validateAndSanitizeBackup` vérifie la structure des objets mais ne déduplique pas les éléments par clé primaire (`id` ou couple composite `habitId+date` pour les complétions et freezeDays). Si le fichier JSON exporté ou édité contient deux fois la même complétion (même `id` ou même `habitId+date`), l'exécution de `db.completions.bulkAdd` dans `SettingsPage.tsx` déclenche une exception Dexie `ConstraintError: Key already exists`. Toute la transaction échoue, annulant la restauration et laissant la base de données vide ou dans un état corrompu.
* **Correction proposée** :
  1. Dans `validateAndSanitizeBackup`, ajouter une déduplication stricte à l'aide d'un `Set<string>` pour `completions`, `freezeDays`, `moods`, `badges` et `xpEvents`.
  2. Dans `SettingsPage.tsx`, utiliser `bulkPut` au lieu de `bulkAdd` pour garantir l'idempotence des écritures.

---

### BUG-CRIT-04 — Absence de Content-Security-Policy (CSP) dans `index.html`
* **Axe** : c. Electron et sécurité
* **Fichier** : [`index.html`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/index.html#L1-L17)
* **Lignes** : 1–17
* **Explication** : Le fichier `index.html` ne définit aucune directive CSP (`<meta http-equiv="Content-Security-Policy" ...>`). Dans une application Electron qui charge des données externes (notes de version de l'auto-updater GitHub Releases, importations de fichiers JSON), l'absence de CSP ouvre la porte à des injections de code non restreintes et à l'exfiltration de données si un payload malveillant était interprété.
* **Correction proposée** :
  Ajouter une balise CSP stricte dans `<head>` de `index.html` autorisant `default-src 'self'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com data:`, `img-src 'self' data: https:`, et `connect-src 'self' https://api.github.com https://github.com`.

---

### BUG-CRIT-05 — Navigation externe non interceptée dans Electron (`will-navigate`)
* **Axe** : c. Electron et sécurité
* **Fichier** : [`electron/main.cjs`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/electron/main.cjs#L164-L169)
* **Lignes** : 164–169
* **Explication** : Seul `mainWindow.webContents.setWindowOpenHandler` est configuré. Ce handler intercepte uniquement les appels `window.open` (ex: `target="_blank"`). Tout lien externe cliqué sans `target="_blank"` ou toute redirection via `window.location.href = 'https://...'` fait naviguer la fenêtre Electron principale directement vers le site web distant, remplaçant l'application locale.
* **Correction proposée** :
  Ajouter l'écouteur `mainWindow.webContents.on('will-navigate', (event, url) => { event.preventDefault(); shell.openExternal(url); });` pour forcer l'ouverture dans le navigateur par défaut de l'OS.

---

### BUG-CRIT-06 — Absence d'ErrorBoundary global (Écran blanc sans récupération possible)
* **Axe** : e. Fuites et stabilité
* **Fichier** : [`src/App.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/App.tsx#L75-L125) et [`src/main.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/main.tsx#L1-L10)
* **Lignes** : 75–125
* **Explication** : Aucun composant React `ErrorBoundary` n'enveloppe l'application. Si un composant React lève une exception inattendue lors du rendu (par exemple suite à des données IndexedDB corrompues ou une erreur de calcul), l'ensemble de l'arbre React se démonte, affichant un écran noir/blanc sans aucun message d'erreur ni moyen de récupération. L'utilisateur perd l'accès à ses habitudes sans pouvoir exporter sa sauvegarde de secours.
* **Correction proposée** :
  Créer un composant `ErrorBoundary.tsx` avec un état de secours élégant intégrant :
  1. Un bouton **"Recharger l'application"** (`window.location.reload()`).
  2. Un bouton **"Exporter mes données de secours"** (lisant directement IndexedDB pour générer un JSON de téléchargement même en cas de crash React).
  3. L'affichage du message d'erreur technique pour le diagnostic.

---

## 🟡 2. Problèmes Importants

### BUG-IMP-01 — Formule de niveau erronée sur ProfilePage (Modulo 100 au lieu du moteur RPG)
* **Axe** : a. Bugs de logique & g. Qualité du code
* **Fichier** : [`src/pages/ProfilePage.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/pages/ProfilePage.tsx#L66) et [`src/pages/ProfilePage.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/pages/ProfilePage.tsx#L130-L151)
* **Lignes** : 66 et 130–151
* **Explication** : Sur la page Profil, la progression est calculée via `const xpInCurrentLevel = totalXP % 100`, et l'interface affiche systématiquement `xpInCurrentLevel / 100 XP` et `Encore (100 - xpInCurrentLevel) XP avant le niveau suivant`. Or, le moteur d'expérience de Habix (`src/services/xp.ts`) suit une courbe exponentielle non-linéaire (Niveau 2 = 100 XP, Niveau 5 = 1118 XP, Niveau 10 = 4641 XP, etc.). Les données affichées sur la page Profil sont fausses et en contradiction directe avec le niveau réel affiché dans le header et le composant `DailyXPRecap`.
* **Correction proposée** :
  Remplacer le calcul naïf par `const levelInfo = getLevelInfo(totalXP)` importé de `src/services/xp.ts`, et utiliser `levelInfo.currentLevelXP`, `levelInfo.xpForNextLevel` et `levelInfo.progressPercent`.

---

### BUG-IMP-02 — Démultiplication du bonus de journée parfaite dans `DailyXPRecap`
* **Axe** : a. Bugs de logique (XP & récap du jour)
* **Fichier** : [`src/components/gamification/DailyXPRecap.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/components/gamification/DailyXPRecap.tsx#L84-L94)
* **Lignes** : 84–94
* **Explication** : Dans le calcul de `estimatedXP`, `calculateXPGain({ difficulty: h.difficulty, currentStreak: streak.current, isPerfectDay: isAllDone })` est appelé à l'intérieur de la boucle `reduce` pour chaque habitude validée. Lorsque `isAllDone` est vrai, le bonus de +50 XP est injecté pour chaque habitude (ex: 5 habitudes = +250 XP au lieu de +50 XP).
* **Correction proposée** :
  Passer `isPerfectDay: false` dans la boucle par habitude, et ajouter une seule fois `isAllDone ? 50 : 0` au total calculé.

---

### BUG-IMP-03 — Doublon de badges et modales multiples lors d'évaluations concurrentes
* **Axe** : a. Bugs de logique & e. Stabilité
* **Fichier** : [`src/stores/useGamificationStore.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/stores/useGamificationStore.ts#L281-L294)
* **Lignes** : 281–294
* **Explication** : `checkBadges` est déclenché par un `useEffect` dépendant de multiples stores (`completions`, `habits`, `moods`, etc.). Si deux déclenchements surviennent rapidement, la deuxième évaluation s'exécute avant que la première n'ait fini d'écrire dans `badgeRepository.unlock(badge.id)`. Le même badge est évalué comme nouvellement débloqué dans les deux runs et ajouté en doublon dans `pendingBadges`, provoquant un double affichage de la modal de déblocage.
* **Correction proposée** :
  1. Ajouter un drapeau de verrouillage synchrone `isCheckingBadges`.
  2. Filtrer `pendingBadges` avec `newBadges.filter(b => !prev.pendingBadges.some(p => p.id === b.id))` pour interdire tout doublon dans la file d'attente de modales.

---

### BUG-IMP-04 — Exploit de complétion instantanée des défis 21 & 30 jours
* **Axe** : a. Bugs de logique (Défis)
* **Fichier** : [`src/stores/useChallengeStore.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/stores/useChallengeStore.ts#L62-L91)
* **Lignes** : 62–91
* **Explication** : `updateChallengeProgress(habitId, _today, isCompleted, isFrozen)` ignore le paramètre de date `_today` et incrémente `currentDay` dès que `isCompleted` est vrai. Si un utilisateur coche, décoche et recoche une habitude plusieurs fois dans la même journée, chaque re-cochage incrémente `currentDay`. Il est ainsi possible de terminer un défi de 21 jours en 2 minutes le même jour et de toucher le bonus de 100/200 XP immédiatement.
* **Correction proposée** :
  1. Ajouter un champ `lastProgressDate?: string` sur le modèle `Challenge`.
  2. N'incrémenter `currentDay` que si `today !== challenge.lastProgressDate`.

---

### BUG-IMP-05 — Jours de repos ignorés sur la page Aujourd'hui (`TodayPage`)
* **Axe** : a. Bugs de logique (Habitudes & calendrier)
* **Fichier** : [`src/pages/TodayPage.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/pages/TodayPage.tsx#L91-L104)
* **Lignes** : 91–104
* **Explication** : Le filtre `habitsForToday` exclut les habitudes `weekly_fixed` qui ne tombent pas le jour courant, mais ignore complètement `habit.restDays`. Si un utilisateur définit le dimanche comme jour de repos pour une habitude quotidienne, elle continue d'être comptée dans `totalExpected` le dimanche. Cela empêche l'utilisateur d'obtenir une "Journée parfaite" (100%) sans effectuer son habitude en repos, alors que les règles du moteur de streak (`STREAK_RULES.md`) spécifient qu'un jour de repos est transparent et non exigible.
* **Correction proposée** :
  Exclure les habitudes dont le jour courant fait partie de `habit.restDays` du calcul de `totalExpected`, ou les afficher sous un statut spécifique "En repos" n'impactant pas le quota de la journée parfaite.

---

### BUG-IMP-06 — Non-respect du réglage "Animations" pour les effets de confettis
* **Axe** : f. Accessibilité et UX
* **Fichier** : [`src/utils/confetti.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/utils/confetti.ts#L3-L27)
* **Lignes** : 3–27
* **Explication** : `triggerCompletionConfetti` et `triggerLevelUpConfetti` vérifient uniquement `prefers-reduced-motion` du système, mais ignorent l'interrupteur interne `settings.animationsEnabled` configuré par l'utilisateur dans les paramètres de Habix.
* **Correction proposée** :
  Lire `useSettingsStore.getState().settings.animationsEnabled` et interrompre immédiatement l'émission de particules si les animations sont désactivées.

---

### BUG-IMP-07 — Nettoyage manquant de l'intervalle de mise à jour dans Electron (Intervalle 4h)
* **Axe** : c. Electron & e. Fuites mémoire
* **Fichier** : [`electron/main.cjs`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/electron/main.cjs#L90-L96)
* **Lignes** : 90–96
* **Explication** : L'intervalle de vérification des mises à jour toutes les 4 heures (`setInterval(..., 4 * 60 * 60 * 1000)`) n'est assigné à aucune variable et n'est jamais nettoyé lors de la fermeture de la fenêtre ou de l'application.
* **Correction proposée** :
  Affecter l'intervalle à `updaterInterval` et appeler `clearInterval(updaterInterval)` lors des événements `closed` et `before-quit`.

---

### BUG-IMP-08 — Scripts de génération d'icônes obsolètes et redondants
* **Axe** : g. Qualité du code
* **Fichiers** : [`scripts/generate-icons.js`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/scripts/generate-icons.js) et [`scripts/generate-electron-icons.js`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/scripts/generate-electron-icons.js)
* **Explication** : `scripts/generate-all-icons.js` génère déjà toutes les icônes nécessaires (build, electron, public) avec sharp et png-to-ico. Les deux autres fichiers sont des scripts orphelins non référencés dans `package.json` contenant du code mort d'anciennes itérations.
* **Correction proposée** :
  Supprimer `generate-icons.js` et `generate-electron-icons.js` pour éliminer le code mort.

---

## 🟢 3. Problèmes Mineurs

### BUG-MIN-01 — Calculs de date via `Date.now() - 86400000` au lieu de `subtractDays`
* **Axe** : a. Bugs de logique & d. Performance
* **Fichier** : [`src/components/stats/HabitComparisonChart.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/components/stats/HabitComparisonChart.tsx#L50) et [`src/db/seed.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/db/seed.ts#L49)
* **Lignes** : 50 (`HabitComparisonChart.tsx`) et 49 (`seed.ts`)
* **Explication** : Calculer un jour calendaire passé en soustrayant des millisecondes et en appelant `.toISOString().substring(0, 10)` génère une date UTC qui peut être décalée d'un jour par rapport à la date locale autour de minuit ou lors d'un passage à l'heure d'été/hiver.
* **Correction proposée** :
  Remplacer par `subtractDays(today, 30)` issu de `src/lib/date-utils.ts`.

---

### BUG-MIN-02 — Recalcul inutile de tous les streaks lors du tri dans `HabitComparisonChart`
* **Axe** : d. Performance
* **Fichier** : [`src/components/stats/HabitComparisonChart.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/components/stats/HabitComparisonChart.tsx#L41-L72)
* **Lignes** : 41–72
* **Explication** : `useMemo` recalcule `calculateStreak` pour toutes les habitudes à chaque changement de l'état `metric` (Total, Streak, Taux), alors que seules les clés de tri changent.
* **Correction proposée** :
  Mémoriser les statistiques brutes indépendamment de `metric`, puis trier le tableau résultant dans un `useMemo` léger dédié.

---

### BUG-MIN-03 — Nœuds Web Audio API non déconnectés après terminaison
* **Axe** : e. Fuites et stabilité
* **Fichier** : [`src/lib/sounds.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/lib/sounds.ts#L98-L100)
* **Lignes** : 98–100, 133–135, 172–174, 220–222
* **Explication** : Les oscillateurs appellent `osc.stop()`, mais les liaisons `gain.connect(ctx.destination)` ne sont pas déconnectées explicitement, ce qui peut retarder la libération par le ramasse-miettes (GC) lors de clics intensifs.
* **Correction proposée** :
  Ajouter un handler `osc.onended = () => { osc.disconnect(); gain.disconnect(); }`.

---

### BUG-MIN-04 — Synchronisation dynamique du thème système (`matchMedia`)
* **Axe** : f. Accessibilité et UX
* **Fichier** : [`src/App.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/App.tsx#L98-L107)
* **Lignes** : 98–107
* **Explication** : Si `settings.theme === 'system'`, l'attribut `data-theme` est positionné une fois au montage mais n'écoute pas les changements d'heure ou de préférence de l'OS (ex: bascule automatique coucher de soleil).
* **Correction proposée** :
  Ajouter un `addEventListener('change', listener)` sur la `MediaQueryList` lorsque le mode est `system`, avec nettoyage au démontage.

---

### BUG-MIN-05 — Accessibilité modale (Échap et ARIA) sur les popups de gamification
* **Axe** : f. Accessibilité et UX
* **Fichier** : [`src/components/gamification/LevelUpModal.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/components/gamification/LevelUpModal.tsx#L19-L38) et [`src/components/gamification/BadgeUnlockModal.tsx`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/components/gamification/BadgeUnlockModal.tsx#L13-L32)
* **Lignes** : 19–38 (`LevelUpModal`) et 13–32 (`BadgeUnlockModal`)
* **Explication** : Les modals de célébration n'utilisent pas le composant `Modal.tsx`. Elles ne gèrent pas la fermeture par la touche `Échap`, ne disposent pas d'attributs `role="dialog"`, ni de focus trap pour les lecteurs d'écran.
* **Correction proposée** :
  Ajouter `role="dialog"`, `aria-modal="true"` et l'écouteur de la touche `Escape`.

---

### BUG-MIN-06 — Éléments `console.warn` résiduels dans les stores
* **Axe** : g. Qualité du code
* **Fichier** : [`src/stores/useGamificationStore.ts`](file:///c:/Users/Lilian/Documents/projet%20vibe%20code/habix/src/stores/useGamificationStore.ts#L97)
* **Lignes** : 97, 140, 164
* **Explication** : Présence d'instructions `console.warn` en production pouvant polluer les outils de développement ou la console Electron.
* **Correction proposée** :
  Conditionner ces messages à `import.meta.env.DEV`.

---

## 🔒 4. Analyse de Sécurité & Dépendances (`npm audit`)

Le scan `npm audit` a identifié 24 vulnérabilités dans l'arbre des dépendances de développement et de build :
1. **tinypool** (<= 2.1.1) : Prototype pollution gadget. Nécessite `vitest@5.0.5` (mise à niveau majeure avec rupture).
2. **braces** via **chokidar / tailwindcss** : ReDoS. Nécessite `tailwindcss@4` (refonte majeure).
3. **esbuild / vite** : Cross-origin development access. Nécessite `vite@8`.
4. **react-router** (6.27.0) : Open redirect via backslash. Nécessite `react-router@7`.

### Recommandation Formelle :
Conformément à la consigne stricte de **ne pas changer de dépendance majeure sans validation préalable**, aucune de ces dépendances majeures ne sera forcée vers sa version N+1. Ces vulnérabilités concernent principalement l'environnement local de développement Vite et le serveur de dev, et ne compromettent pas le bundle de production Electron packagé en mode `file://` local.

---

## 📊 Plan d'Exécution des Corrections (Étape 2)

Les corrections seront appliquées dans l'ordre strict suivant, après écriture des tests unitaires de non-régression correspondants :

1. **Lot 1 — Critiques (Sécurité & Données)** :
   - Ajout du composant `ErrorBoundary.tsx` avec options "Recharger" et "Exporter mes données de secours".
   - Ajout de la balise CSP stricte dans `index.html`.
   - Ajout de l'interception `will-navigate` dans `electron/main.cjs`.
   - Déduplication et sécurisation de l'import JSON dans `src/services/import-export.ts` et `SettingsPage.tsx` avec `bulkPut`.
2. **Lot 2 — Critiques & Importants (Logique métier & Anti-exploits)** :
   - Verrouillage anti-race condition sur `handleToggle` dans `TodayPage.tsx`.
   - Résolution du bug de minuit (`todayAwardedDate`) dans `useGamificationStore.ts`.
   - Correction de la formule de niveau exponentielle sur `ProfilePage.tsx` (`getLevelInfo`).
   - Correction du calcul d'XP dans `DailyXPRecap.tsx`.
   - Déduplication de la file d'attente de badges dans `useGamificationStore.ts`.
   - Anti-exploit sur les défis 21/30 jours dans `useChallengeStore.ts` (`lastCompletedDate`).
   - Prise en compte des `restDays` dans `habitsForToday` (`TodayPage.tsx`).
3. **Lot 3 — Accessibilité, Performance & Nettoyage** :
   - Respect de `settings.animationsEnabled` dans `confetti.ts`.
   - Accessibilité clavier et ARIA sur les modals de gamification.
   - Nettoyage du timer d'auto-update dans Electron (`electron/main.cjs`).
   - Suppression des scripts orphelins `scripts/generate-icons.js` et `scripts/generate-electron-icons.js`.
   - Mémoïsation affinée des calculs lourds dans les graphiques (`HabitComparisonChart.tsx`, `StatsPage.tsx`).
