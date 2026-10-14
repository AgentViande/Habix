# STREAK_RULES.md — Règles de calcul des streaks

> Ce document définit avec précision comment les streaks sont calculés dans Habix.
> Il couvre tous les types de fréquences, les jours de gel, les jours de repos,
> la rétroactivité, et les cas limites liés aux fuseaux horaires.

---

## 1. Définition

Un **streak** est le nombre de **périodes attendues consécutives** pendant lesquelles
une habitude a été complétée (ou gelée), sans interruption.

> ⚠️ Le streak compte des *périodes attendues*, pas des jours calendaires.
> Un jour de repos ou un jour où l'habitude n'est pas attendue n'interrompt pas
> le streak et n'est pas compté.

---

## 2. Notion de « jour » et fuseau horaire

### 2.1 Date locale

Toutes les dates sont stockées et calculées en **date locale** de l'utilisateur,
au format `YYYY-MM-DD`.

```
Date locale = new Date().toLocaleDateString('fr-CA')
// Résultat : "2026-10-14" (format ISO compatible)
```

### 2.2 Minuit et changement de jour

Le jour change à **00:00 heure locale** selon le fuseau horaire configuré dans les
paramètres (`settings.timezone`).

- Si l'utilisateur complète une habitude à 23:59 → compte pour aujourd'hui.
- Si l'utilisateur complète à 00:01 → compte pour le nouveau jour.
- Pas de concept de « jour étendu » (pas de grâce jusqu'à 3h du matin).

### 2.3 Changement de fuseau horaire

Si l'utilisateur voyage et change de fuseau :

1. Les complétions passées restent inchangées (la date `YYYY-MM-DD` est figée).
2. Le « jour courant » est recalculé avec le nouveau fuseau.
3. **Cas limite** : si le changement de fuseau fait « sauter » ou « dédoubler »
   un jour :
   - **Jour sauté** (ex : traversée de la ligne de date vers l'ouest) : le jour
     manquant est traité comme un jour non attendu — il n'interrompt pas le streak.
   - **Jour dédoublé** (ex : traversée vers l'est) : seule la première complétion
     pour cette date est comptée.

### 2.4 Implémentation

```typescript
function getLocalDate(timezone: string): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: timezone });
  // "fr-CA" retourne le format YYYY-MM-DD
}
```

---

## 3. Calcul du streak par type de fréquence

### 3.1 Habitude quotidienne (`daily`)

**Attendue** : tous les jours (sauf jours de repos).

**Algorithme** :

```
streak = 0
jour = aujourd'hui

TANT QUE vrai :
  SI jour est un jour de repos → passer au jour précédent, CONTINUER
  SI jour a une complétion valide → streak += 1
  SINON SI jour a un gel → streak += 0 (préservé, pas incrémenté)
  SINON :
    SI jour == aujourd'hui → ne pas casser (la journée n'est pas finie)
    SINON → BREAK (streak cassé)
  jour = jour - 1 jour
```

**Exemple** :

```
Habitude : Méditer (quotidienne, repos le dimanche)

Lun 5  : ✅ complété
Mar 6  : ✅ complété
Mer 7  : ❄️ gelé
Jeu 8  : ✅ complété
Ven 9  : ✅ complété
Sam 10 : ✅ complété
Dim 11 : 😴 repos (ignoré)
Lun 12 : ✅ complété
Mar 13 : ❌ manqué
Mer 14 : ✅ complété (aujourd'hui)

Streak courant = 1 (cassé mardi 13)
Si aujourd'hui était Lun 12 : streak = 6 (lun→sam + jeu-ven-sam + gel mer=préservé + lun-mar)
```

### 3.2 Habitude hebdomadaire — Jours fixes (`weekly_fixed`)

**Attendue** : uniquement les jours sélectionnés.

**Algorithme** :

```
streak = 0
jour = aujourd'hui

TANT QUE vrai :
  SI jour n'est PAS un jour attendu ET n'est PAS un jour de repos → passer, CONTINUER
  SI jour est un jour de repos → passer, CONTINUER
  SI jour est un jour attendu :
    SI jour a une complétion → streak += 1
    SINON SI jour a un gel → streak += 0 (préservé)
    SINON :
      SI jour == aujourd'hui → ne pas casser
      SINON → BREAK
  jour = jour - 1 jour
```

**Exemple** :

```
Habitude : Sport (lundi, mercredi, vendredi)

Ven 2  : ✅ → streak = 1
Lun 5  : ✅ → streak = 2
Mer 7  : ❄️ → streak préservé (= 2)
Ven 9  : ✅ → streak = 3
Lun 12 : ❌ manqué → BREAK
Mer 14 : ✅ (aujourd'hui) → streak = 1

Résultat : streak courant = 1
```

### 3.3 Habitude hebdomadaire — X fois/semaine (`weekly_flex`)

**Attendue** : au moins `timesPerWeek` complétions dans la semaine (lundi→dimanche
par défaut, configurable via `weekStartDay`).

**Algorithme** :

Le streak est compté en **semaines**, pas en jours.

```
streak = 0
semaine = semaine courante

TANT QUE vrai :
  completions_semaine = COUNT(completions WHERE semaine)
  gels_semaine = COUNT(gels WHERE semaine)

  SI completions_semaine >= timesPerWeek → streak += 1
  SINON SI (completions_semaine + gels_semaine) >= timesPerWeek → streak += 0 (préservé)
  SINON :
    SI semaine == semaine courante → ne pas casser (semaine en cours)
    SINON → BREAK
  semaine = semaine précédente
```

**Affichage** : « Streak : 4 semaines 🔥 » (unité = semaine).

**Exemple** :

```
Habitude : Courir 3×/semaine

Sem 1 (5-11 oct) : 3 complétions → streak = 1
Sem 2 (12-18 oct) : 2 complétions + 1 gel → streak préservé (= 1)
Sem 3 (19-25 oct) : 4 complétions → streak = 2
Sem 4 (26 oct-1 nov) : 1 complétion (en cours) → ne pas casser

Résultat : streak courant = 2 semaines (la semaine 4 est en cours)
```

### 3.4 Habitude par intervalle (`interval`)

**Attendue** : au moins une complétion tous les `everyNDays` jours.

**Algorithme** :

```
streak = 0
derniere_completion = date de la dernière complétion

SI derniere_completion est NULL → streak = 0, RETURN

// Vérifier la fenêtre courante
SI (aujourd'hui - derniere_completion) > everyNDays :
  streak = 0, RETURN

// Remonter dans l'historique
completions = toutes les complétions triées par date DESC

POUR i DE 0 À completions.length - 2 :
  date_courante = completions[i].date
  date_precedente = completions[i + 1].date
  ecart = date_courante - date_precedente (en jours)
  jours_gel = COUNT(gels BETWEEN date_precedente AND date_courante)

  SI (ecart - jours_gel) <= everyNDays → streak += 1
  SINON → BREAK

streak += 1  // compter la première complétion
```

**Exemple** :

```
Habitude : Appeler maman (tous les 3 jours)

Oct 2  : ✅ → ok
Oct 5  : ✅ → écart = 3 ≤ 3 → ok
Oct 7  : ✅ → écart = 2 ≤ 3 → ok
Oct 11 : ✅ → écart = 4 > 3 → BREAK

Streak courant = 3 (oct 5 → 7 → 11)
Non, recalculons : on part de la plus récente.
Oct 11 : compté (+1)
Oct 11 → Oct 7 : écart = 4 > 3 → BREAK

Streak courant = 1
```

---

## 4. Jours de gel — Règles détaillées

### 4.1 Propriétés

- Un gel est **spécifique à une habitude** (on peut geler une habitude sans affecter
  les autres).
- Un gel peut être posé sur :
  - Le **jour courant** (avant minuit).
  - Un **jour passé** dans la fenêtre de rétroactivité (`settings.retroactiveDays`).
- Un gel ne peut **pas** être posé sur un jour qui a déjà une complétion.
- Un gel peut être **retiré** (annulé) tant qu'il est dans la fenêtre de
  rétroactivité.

### 4.2 Effet sur le streak

- Un jour gelé **préserve** le streak mais ne l'**incrémente** pas.
- Concrètement : le jour gelé est « transparent » dans la chaîne du streak.

```
✅ ✅ ❄️ ✅ → streak = 3 (le gel ne casse pas, ne compte pas)
✅ ✅ ❄️ ❄️ ✅ → streak = 3
✅ ❄️ ❌ ✅ → streak = 1 (le gel ne protège pas le jour manqué)
```

### 4.3 Gel et habitude hebdomadaire flex

Pour les habitudes `weekly_flex`, un gel compte dans le total de la semaine
pour atteindre le seuil, mais ne donne pas de complétion.

```
Habitude : 3×/semaine
Semaine : 2 complétions + 1 gel = seuil atteint → streak préservé
```

### 4.4 Gel et défis

- Un jour gelé **suspend** le défi (le compteur de jours ne progresse pas).
- Le défi n'est pas cassé par un gel.
- La date de fin du défi est repoussée d'autant.

### 4.5 Gel et XP

- Aucun XP gagné pour un jour gelé.
- Le multiplicateur de streak est maintenu (puisque le streak est préservé).

---

## 5. Jours de repos — Règles détaillées

### 5.1 Propriétés

- Définis dans la configuration de l'habitude (`restDays: number[]`).
- Fixes (même jours chaque semaine).
- Ne s'appliquent qu'aux habitudes `daily` et `weekly_fixed`.

### 5.2 Effet sur le streak

- Un jour de repos est **complètement ignoré** dans le calcul du streak.
- Il n'interrompt jamais le streak.
- Il n'est pas compté (ni +1, ni préservé — simplement sauté).

```
Habitude quotidienne, repos le dimanche :
Ven : ✅, Sam : ✅, Dim : 😴, Lun : ✅ → streak = 3 (dim ignoré)
```

### 5.3 Différence avec le gel

| Aspect | Jour de repos | Jour de gel |
|---|---|---|
| Planification | Fixe (configuration) | À la demande |
| Streak | Ignoré (transparent) | Préservé (transparent) |
| Complétion possible | Non attendue (mais l'utilisateur peut quand même compléter → bonus XP) | Non (gel bloque la complétion) |
| Visuel calendrier | Gris clair / hachures | Bleu / ❄️ |

---

## 6. Rétroactivité — Effet sur le streak

### 6.1 Principe

Quand l'utilisateur complète rétroactivement une habitude pour un jour passé :

1. La complétion est ajoutée avec la date passée.
2. Le streak est **intégralement recalculé** depuis aujourd'hui.
3. L'XP est calculé et attribué **au moment du recalcul** (pas au moment de la
   date rétroactive).

### 6.2 Cas : une complétion rétroactive « répare » un streak cassé

```
Avant rétroactivité :
Lun : ✅, Mar : ✅, Mer : ❌, Jeu : ✅, Ven : ✅
Streak courant = 2 (jeu-ven)

L'utilisateur complète rétroactivement Mercredi :
Lun : ✅, Mar : ✅, Mer : ✅, Jeu : ✅, Ven : ✅
Streak courant = 5 ← RECALCULÉ
```

### 6.3 Cas : suppression d'une complétion rétroactive

Si l'utilisateur retire une complétion passée :
- Le streak est recalculé (potentiellement cassé).
- L'XP correspondant est **retiré**.
- Les badges qui ne sont plus valides sont **conservés** (une fois débloqué,
  un badge n'est jamais retiré — politique « acquis définitif »).

---

## 7. Meilleur streak (best streak)

### 7.1 Calcul

Le meilleur streak est le streak le plus long jamais atteint pour une habitude.

**Algorithme** :

```
best_streak = 0
current_run = 0

POUR chaque jour DE date_création À aujourd'hui :
  SI jour est un jour de repos → CONTINUER
  SI jour a une complétion → current_run += 1
  SINON SI jour a un gel → CONTINUER (préservé, pas incrémenté)
  SINON :
    best_streak = MAX(best_streak, current_run)
    current_run = 0

best_streak = MAX(best_streak, current_run)
```

### 7.2 Stockage

Le meilleur streak n'est **pas stocké en base**. Il est recalculé à la demande
(avec mise en cache via `useMemo` dans le hook `useStreak`).

**Justification** : stocker le meilleur streak introduirait un risque de
désynchronisation avec les données réelles (complétion rétroactive, suppression).
Le recalcul est rapide même sur 1+ an de données (itération linéaire sur les
complétions indexées par `habitId`).

---

## 8. Cas limites

### 8.1 Habitude créée aujourd'hui

- Streak = 0 (la journée n'est pas encore terminée).
- Si l'utilisateur complète → streak = 1.

### 8.2 Habitude archivée

- Le streak est figé à la date d'archivage.
- Si l'habitude est désarchivée, le streak repart de 0 (la chaîne est cassée
  par la période d'inactivité).

### 8.3 Aucune complétion jamais

- Streak courant = 0.
- Meilleur streak = 0.

### 8.4 Complétion sur un jour de repos

- Si l'utilisateur complète volontairement un jour de repos, la complétion est
  enregistrée et donne de l'XP (bonus).
- Mais le jour de repos reste ignoré dans le calcul du streak (il ne contribue
  ni positivement ni négativement).

### 8.5 Gel sur un jour de repos

- Interdit (pas de sens). L'UI ne propose pas le gel sur un jour de repos.

### 8.6 Multiples complétions le même jour (habitude chiffrée)

- Seule la **dernière valeur** est conservée (mise à jour, pas ajout).
- Le streak ne compte qu'une seule complétion par jour.
- Pour les habitudes chiffrées, la complétion est comptée si `value >= targetValue`.

### 8.7 Changement de fréquence d'une habitude

Si l'utilisateur change la fréquence (ex : quotidienne → 3×/semaine) :

- Les complétions passées sont conservées.
- Le streak est **réinitialisé à 0** à partir de la date du changement.
- Le meilleur streak historique (avec l'ancienne fréquence) est préservé dans le
  calcul du best streak.
- **Justification** : les règles de streak sont fondamentalement différentes entre
  les types de fréquence — tenter de convertir serait source d'erreurs et de
  confusion.

### 8.8 Premier jour de la semaine (weekly_flex)

Le début de semaine dépend du paramètre `settings.weekStartDay`. Par défaut :
lundi. Le calcul de la semaine en cours utilise `date-fns/startOfWeek` avec
l'option `weekStartsOn` correspondante.

### 8.9 Habitude intervalle — Premier intervalle

Après création, le premier intervalle commence à la date de création. Si
l'utilisateur ne complète pas dans les `everyNDays` jours suivants, le streak
reste à 0 (pas de pénalité — il n'y a simplement pas encore de streak).

---

## 9. Résumé visuel des états quotidiens

```
┌────────────┬──────────┬───────────┬────────────────┐
│ État       │ Symbole  │ Streak    │ XP             │
├────────────┼──────────┼───────────┼────────────────┤
│ Complété   │ ✅ vert  │ +1        │ Oui            │
│ Gelé       │ ❄️ bleu  │ Préservé  │ Non            │
│ Repos      │ 😴 gris  │ Ignoré    │ Non (sauf si   │
│            │          │           │ complété → oui)│
│ Manqué     │ ❌ rouge │ Cassé     │ Non            │
│ En cours   │ ⏳ jaune │ En attente│ Pas encore     │
│ Non attendu│ — vide   │ Ignoré    │ Non            │
└────────────┴──────────┴───────────┴────────────────┘
```

---

## 10. Pseudo-code complet — `calculateCurrentStreak`

```typescript
function calculateCurrentStreak(
  habit: Habit,
  completions: Completion[],   // triées par date DESC
  freezeDays: FreezeDay[],     // triées par date DESC
  today: string,               // "YYYY-MM-DD"
  settings: Settings
): number {

  if (habit.frequencyType === 'weekly_flex') {
    return calculateWeeklyFlexStreak(habit, completions, freezeDays, today, settings);
  }

  if (habit.frequencyType === 'interval') {
    return calculateIntervalStreak(habit, completions, freezeDays, today);
  }

  // daily + weekly_fixed
  const completionSet = new Set(completions.map(c => c.date));
  const freezeSet = new Set(freezeDays.map(f => f.date));
  const restDaySet = new Set(habit.restDays);

  let streak = 0;
  let date = today;

  while (true) {
    const dayOfWeek = getDayOfWeek(date); // 0=dim … 6=sam

    // Jour de repos → ignorer
    if (restDaySet.has(dayOfWeek)) {
      date = subtractDay(date);
      continue;
    }

    // Habitude weekly_fixed : jour non attendu → ignorer
    if (habit.frequencyType === 'weekly_fixed') {
      const expectedDays = (habit.frequencyConfig as FrequencyConfigWeeklyFixed).days;
      if (!expectedDays.includes(dayOfWeek)) {
        date = subtractDay(date);
        continue;
      }
    }

    // Jour attendu : vérifier complétion ou gel
    if (completionSet.has(date)) {
      streak += 1;
    } else if (freezeSet.has(date)) {
      // Streak préservé, pas incrémenté
    } else {
      // Pas de complétion ni gel
      if (date === today) {
        // Aujourd'hui → la journée n'est pas finie, ne pas casser
      } else {
        break; // Streak cassé
      }
    }

    date = subtractDay(date);
  }

  return streak;
}
```
