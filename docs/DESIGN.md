# DESIGN.md — Direction artistique de Habix

> Design system, palette, typographie, composants, animations, thèmes et responsive.
> Approche mobile-first, premium, vivante.

---

## 1. Vision design

Habix doit donner l'impression d'un outil **premium et vivant** — pas un simple
todo list. L'interface doit :

- **Récompenser visuellement** chaque action (micro-animations, feedback haptique).
- **Motiver** par le progrès visible (flammes, barres XP, confettis).
- **Rester lisible** malgré la richesse visuelle (hiérarchie claire, espaces).
- **Fonctionner naturellement** sur mobile (gestes, touch targets 44px+).

Inspirations : Habitica (gamification), Streaks (minimalisme premium), Things 3
(polish), Arc Browser (couleurs vivantes), Linear (dark mode élégant).

---

## 2. Palette de couleurs

### 2.1 Mode sombre (par défaut)

| Token CSS | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0B0F1A` | Fond principal (quasi-noir bleuté) |
| `--bg-secondary` | `#111827` | Cartes, surfaces élevées |
| `--bg-tertiary` | `#1E293B` | Champs de saisie, hover |
| `--bg-elevated` | `#1A2332` | Modals, popovers, sidebar |
| `--border-subtle` | `#1E293B` | Bordures subtiles |
| `--border-default` | `#334155` | Bordures visibles |
| `--text-primary` | `#F1F5F9` | Texte principal |
| `--text-secondary` | `#94A3B8` | Texte secondaire |
| `--text-muted` | `#64748B` | Texte désactivé, placeholders |
| `--accent-primary` | `#818CF8` | Indigo — accent principal (boutons, liens) |
| `--accent-primary-hover` | `#6366F1` | Indigo hover |
| `--accent-secondary` | `#A78BFA` | Violet — accent secondaire |
| `--accent-glow` | `rgba(129, 140, 248, 0.15)` | Glow / halo autour des éléments actifs |
| `--success` | `#34D399` | Vert émeraude — complété |
| `--success-bg` | `rgba(52, 211, 153, 0.12)` | Fond success |
| `--warning` | `#FBBF24` | Ambre — en cours, attention |
| `--danger` | `#F87171` | Rouge corail — manqué, erreur |
| `--freeze` | `#60A5FA` | Bleu — jour gelé |
| `--freeze-bg` | `rgba(96, 165, 250, 0.12)` | Fond gel |
| `--xp-gradient-start` | `#818CF8` | Début gradient barre XP |
| `--xp-gradient-end` | `#C084FC` | Fin gradient barre XP (violet) |
| `--streak-fire` | `#FB923C` | Orange — flamme du streak |

### 2.2 Mode clair

| Token CSS | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FAFBFE` | Fond principal |
| `--bg-secondary` | `#FFFFFF` | Cartes |
| `--bg-tertiary` | `#F1F5F9` | Champs, hover |
| `--bg-elevated` | `#FFFFFF` | Modals |
| `--border-subtle` | `#E2E8F0` | Bordures subtiles |
| `--border-default` | `#CBD5E1` | Bordures visibles |
| `--text-primary` | `#0F172A` | Texte principal |
| `--text-secondary` | `#475569` | Texte secondaire |
| `--text-muted` | `#94A3B8` | Texte désactivé |
| `--accent-primary` | `#6366F1` | Indigo (plus saturé en clair) |
| `--accent-primary-hover` | `#4F46E5` | Indigo hover |
| `--accent-secondary` | `#8B5CF6` | Violet |
| `--success` | `#10B981` | Vert |
| `--danger` | `#EF4444` | Rouge |
| `--freeze` | `#3B82F6` | Bleu |

### 2.3 Couleurs des catégories (prédéfinies)

| Catégorie | Couleur |
|---|---|
| Santé 💪 | `#34D399` (émeraude) |
| Mental 🧠 | `#A78BFA` (violet) |
| Productivité 📈 | `#60A5FA` (bleu) |
| Social 👥 | `#FB923C` (orange) |
| Créativité 🎨 | `#F472B6` (rose) |
| Finance 💰 | `#FBBF24` (ambre) |

---

## 3. Typographie

### 3.1 Police principale

**Inter** (Google Fonts) — sans-serif moderne, excellente lisibilité, support des
chiffres tabulaires.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
```

### 3.2 Échelle typographique

| Token | Taille | Poids | Line-height | Usage |
|---|---|---|---|---|
| `--text-display` | 32px / 2rem | 800 | 1.1 | Titre de page |
| `--text-h1` | 24px / 1.5rem | 700 | 1.2 | Titres de section |
| `--text-h2` | 20px / 1.25rem | 600 | 1.3 | Sous-titres |
| `--text-h3` | 16px / 1rem | 600 | 1.4 | Titres de carte |
| `--text-body` | 14px / 0.875rem | 400 | 1.5 | Corps de texte |
| `--text-small` | 12px / 0.75rem | 400 | 1.5 | Légendes, métadonnées |
| `--text-caption` | 11px / 0.6875rem | 500 | 1.4 | Tags, badges |
| `--text-number` | 14px / 0.875rem | 600 | 1 | Chiffres (tabulaires) |

### 3.3 Chiffres

Utiliser `font-variant-numeric: tabular-nums` pour tous les chiffres (streaks,
XP, pourcentages) afin que les colonnes de chiffres soient alignées.

---

## 4. Espacement et grille

### 4.1 Système d'espacement

Base : **4px**. Tous les espacements sont des multiples de 4.

| Token | Valeur | Usage |
|---|---|---|
| `--space-1` | 4px | Micro-espacement (entre icône et texte) |
| `--space-2` | 8px | Padding interne compact |
| `--space-3` | 12px | Gap entre éléments |
| `--space-4` | 16px | Padding de carte |
| `--space-5` | 20px | Gap de section |
| `--space-6` | 24px | Padding de page (mobile) |
| `--space-8` | 32px | Séparation de sections |
| `--space-10` | 40px | Grandes séparations |
| `--space-12` | 48px | Marges de page (desktop) |

### 4.2 Grille de page

- Mobile : colonne unique, padding 16px.
- Tablet (≥768px) : grille 2 colonnes pour les cartes.
- Desktop (≥1024px) : sidebar 260px + contenu, grille 2-3 colonnes.
- Large (≥1280px) : contenu max-width 1200px centré.

---

## 5. Composants — Design system

### 5.1 Cartes (Card)

```
┌─────────────────────────────────────┐
│  Fond: var(--bg-secondary)          │
│  Border: 1px solid var(--border-subtle) │
│  Border-radius: 16px               │
│  Padding: 16px                     │
│  Shadow: 0 1px 3px rgba(0,0,0,0.1) │
│  Hover: border-color: var(--border-default) │
│         + translateY(-1px)          │
│  Transition: all 200ms ease        │
└─────────────────────────────────────┘
```

Variantes :
- **Card elevated** : shadow plus prononcée, pour les modals.
- **Card interactive** : cursor pointer, hover scale(1.01).
- **Card glow** : border avec glow de l'accent (pour le streak actif).

### 5.2 Carte d'habitude (HabitCard)

```
┌──────────────────────────────────────────────┐
│ ┌──────┐                                      │
│ │ 🧘‍♂️  │  Méditer 10 min           🔥 12     │
│ │      │  Santé · Quotidienne      ─────▶     │
│ └──────┘                           [  ✓  ]   │
│                                               │
│  ▓▓▓▓▓▓▓░░░ 7/10 jours ce mois              │
└──────────────────────────────────────────────┘
```

- L'icône émoji est dans un carré arrondi avec le fond `habit.color` à 12% opacité.
- Le streak 🔥 est en orange, avec animation pulse si > 7.
- Le bouton de complétion : cercle de 44px, animation de check (checkmark SVG
  animé + ripple de la couleur de l'habitude).
- Mini barre de progression mensuelle en bas (optionnelle sur mobile).

### 5.3 Boutons (Button)

| Variante | Style |
|---|---|
| **Primary** | Fond accent, texte blanc, hover +darken, active scale(0.97) |
| **Secondary** | Fond transparent, border accent, texte accent |
| **Ghost** | Fond transparent, texte secondary, hover bg-tertiary |
| **Danger** | Fond danger, texte blanc |
| **Icon** | Circulaire, fond transparent, hover bg-tertiary |

Tous les boutons :
- Border-radius : 12px (sauf icon : full).
- Padding : 10px 20px.
- Font-weight : 600.
- Transition : all 150ms ease.
- Focus : outline 2px accent + offset 2px.
- Touch target : min 44×44px.

### 5.4 Barre XP (XPBar)

```
┌──────────────────────────────────────────┐
│  Niv. 12 ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 340/500 XP │
└──────────────────────────────────────────┘
```

- Barre avec gradient `--xp-gradient-start` → `--xp-gradient-end`.
- Hauteur : 8px, border-radius full.
- Fond : `var(--bg-tertiary)`.
- Animation fluide de progression (CSS transition width 600ms ease-out).
- Au level-up : la barre pulse et se remplit d'un éclat blanc.

### 5.5 Calendrier heatmap

```
        Lun Mar Mer Jeu Ven Sam Dim
Sem 1   ██  ██  ░░  ██  ██  ██  ──
Sem 2   ██  ██  ❄️  ██  ❌  ██  ──
Sem 3   ██  ██  ██  ██  ██  ██  ──
```

Légende couleur :
- Vert (4 niveaux d'opacité selon la valeur pour les chiffrées) : complété.
- Bleu : gelé.
- Gris clair : repos.
- Rouge subtil : manqué.
- Vide / bordure en pointillés : futur.

Cellules : 14×14px sur mobile, 18×18px sur desktop, gap 3px, border-radius 3px.

### 5.6 Graphiques (Recharts)

Style commun à tous les graphiques :

```typescript
const chartTheme = {
  backgroundColor: 'transparent',
  gridColor: 'var(--border-subtle)',
  axisColor: 'var(--text-muted)',
  tooltipBg: 'var(--bg-elevated)',
  tooltipBorder: 'var(--border-default)',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
};
```

- Couleurs de séries : palette des catégories.
- Coins arrondis sur les barres (radius 6px).
- Tooltip avec ombre et backdrop-blur.
- Animations d'entrée (fadeIn + scale).
- Responsive : hauteur 200px mobile, 300px desktop.

### 5.7 Modal

- Overlay : fond noir 50% + backdrop-blur(8px).
- Contenu : `var(--bg-elevated)`, border-radius 20px, max-width 480px.
- Animation entrée : scale(0.95) → scale(1) + opacity 0 → 1, 200ms ease-out.
- Animation sortie : scale(1) → scale(0.97) + opacity 1 → 0, 150ms ease-in.
- Fermeture : clic overlay, touche Escape, bouton ✕.

### 5.8 Toast / Notification

- Apparaît en bas-centre (mobile) ou bas-droit (desktop).
- Slide-up + fade-in, auto-dismiss après 3s.
- Variantes : success (vert), info (bleu), warning (ambre), error (rouge).
- Barre de progression de durée en bas du toast.

### 5.9 Badge (BadgeCard)

```
┌─────────────────┐
│      🌋         │  ← Émoji grand (32px)
│                  │
│ Mois incandescent│  ← Nom du badge
│ Streak de 30j   │  ← Description
│                  │
│ ✨ Débloqué !   │  ← Statut (ou cadenas si verrouillé)
└─────────────────┘
```

- Débloqué : fond avec gradient subtil de la couleur de catégorie, bordure dorée.
- Verrouillé : fond `var(--bg-tertiary)`, opacité 50%, icône en niveaux de gris
  (CSS `filter: grayscale(1) opacity(0.4)`).
- Animation de déblocage : shake + pulse + particules dorées.

---

## 6. Animations et micro-interactions

### 6.1 Catalogue d'animations

| Élément | Animation | Durée | Easing |
|---|---|---|---|
| **Check habitude** | Checkmark SVG draw + cercle ripple | 400ms | spring |
| **+XP popup** | Scale-up + float-up + fade-out | 1200ms | ease-out |
| **Level-up** | Flash blanc + confettis + scale bounce | 2000ms | bounce |
| **Streak fire 🔥** | Pulse continu (scale 1→1.1→1) | 2000ms | ease-in-out, infini |
| **Badge unlock** | Shake + scale(1.2) + particules | 1500ms | spring |
| **Card appear** | Fade-in + translateY(8px→0) | 300ms | ease-out |
| **Page transition** | Fade + slide horizontal (20px) | 250ms | ease |
| **Modal open** | Scale(0.95→1) + opacity | 200ms | ease-out |
| **Toast** | SlideY(100%→0) + opacity | 300ms | ease-out |
| **Toggle switch** | Scale spring du knob | 200ms | spring |
| **Heatmap cells** | Staggered fade-in (10ms/cellule) | ~500ms total | ease |
| **Barre de progression** | Width transition | 600ms | ease-out |
| **Compteur numérique** | CountUp animation (font-variant-numeric) | 400ms | ease-out |

### 6.2 Principes d'animation

- **Performance** : utiliser uniquement `transform` et `opacity` (compositing GPU).
- **Respect du mouvement réduit** : `@media (prefers-reduced-motion: reduce)` →
  désactiver toutes les animations, transitions instantanées.
- **Feedback immédiat** : < 100ms pour le feedback tactile.
- **Confettis** : bibliothèque canvas-confetti ou implémentation custom Canvas.

### 6.3 Implémentation des animations

- CSS transitions pour les états simples (hover, active).
- CSS `@keyframes` pour les animations continues (pulse, float).
- `framer-motion` **n'est pas utilisé** (trop lourd) → CSS natif + JS minimal.
- Les animations d'entrée de liste utilisent un stagger CSS via
  `animation-delay: calc(var(--index) * 50ms)`.

---

## 7. Iconographie

### 7.1 Émojis natifs

- Les habitudes et catégories utilisent des **émojis natifs** du système.
- Avantage : pas de téléchargement supplémentaire, familiers à l'utilisateur.
- Affichage dans un carré arrondi coloré (couleur de l'habitude à 12% opacité).

### 7.2 Icônes de navigation et UI

- **Lucide React** (fork de Feather Icons) — ~4KB gzippé en tree-shaking.
- Style : stroke-width 1.75, taille 20px (nav) / 16px (inline).
- Couleur : `var(--text-secondary)`, actif : `var(--accent-primary)`.

Icônes utilisées :
- Navigation : `Home`, `Calendar`, `BarChart3`, `Trophy`, `Target`, `User`,
  `Settings`.
- Actions : `Plus`, `Check`, `X`, `ChevronRight`, `MoreHorizontal`, `Snowflake`,
  `Download`, `Upload`, `Bell`, `Trash2`, `Edit3`, `Archive`.

---

## 8. Responsive — Mobile-first

### 8.1 Breakpoints

| Breakpoint | Largeur | Layout |
|---|---|---|
| **xs** (défaut) | < 640px | Mobile — 1 colonne, bottom nav |
| **sm** | ≥ 640px | Mobile large — 1 colonne élargie |
| **md** | ≥ 768px | Tablette — 2 colonnes, bottom nav |
| **lg** | ≥ 1024px | Desktop — sidebar + 2 colonnes |
| **xl** | ≥ 1280px | Desktop large — sidebar + 3 colonnes, max-width |

### 8.2 Navigation

| Mobile (< 1024px) | Desktop (≥ 1024px) |
|---|---|
| Bottom navigation bar | Sidebar gauche |
| 5 onglets avec icônes | Liens complets (icône + texte) |
| Hauteur : 64px + safe-area | Largeur : 260px |
| Fond : glass effect (bg + blur) | Fond : var(--bg-elevated) |

Bottom nav :
```
┌────────────────────────────────────────┐
│  🏠      📅      📊      🏆      ⚙️   │
│ Aujourd' Calendrier Stats  Profil  Plus │
└────────────────────────────────────────┘
```

Sidebar desktop :
```
┌──────────────┐
│  HABIX       │ ← Logo
│              │
│  👤 Lilian   │ ← Profil mini
│  Niv. 12     │
│  ▓▓▓▓░░ XP   │
│              │
│  ─────────── │
│  🏠 Aujourd'hui │
│  📅 Calendrier  │
│  📊 Statistiques│
│  📝 Revue hebdo │
│  🎯 Défis       │
│  👤 Profil      │
│  ⚙️ Paramètres  │
└──────────────┘
```

### 8.3 Adaptations mobiles

- **Touch targets** : minimum 44×44px.
- **Swipe** : swipe gauche sur une carte → actions rapides (geler, archiver).
- **Pull-to-refresh** : non nécessaire (données locales).
- **Safe areas** : `env(safe-area-inset-*)` pour les encoches et barres.
- **Clavier virtuel** : les modals se repositionnent au-dessus du clavier.

---

## 9. Glassmorphism et effets visuels

### 9.1 Glass effect (navigation)

```css
.glass {
  background: rgba(11, 15, 26, 0.8);   /* --bg-primary avec opacité */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
```

### 9.2 Glow effect (éléments actifs)

```css
.glow {
  box-shadow:
    0 0 0 1px var(--accent-primary),
    0 0 20px var(--accent-glow);
}
```

### 9.3 Gradient mesh (fond de header/profil)

Fond subtil avec un mesh gradient animé (CSS `background: radial-gradient(...)`)
pour donner de la profondeur aux pages de profil et level-up.

---

## 10. Thème — Implémentation technique

### 10.1 Variables CSS

Toutes les couleurs sont définies en variables CSS sur `:root` (mode sombre par
défaut) et redéfinies via `[data-theme="light"]` sur `<html>`.

```css
:root {
  --bg-primary: #0B0F1A;
  --text-primary: #F1F5F9;
  /* ... */
}

[data-theme="light"] {
  --bg-primary: #FAFBFE;
  --text-primary: #0F172A;
  /* ... */
}
```

### 10.2 Détection système

```typescript
// Mode "system" : écouter prefers-color-scheme
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  if (settings.theme === 'system') {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
  }
});
```

### 10.3 Tailwind config

```typescript
// tailwind.config.ts
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          glow: 'var(--accent-glow)',
        },
        // ...
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
    },
  },
};
```

---

## 11. Logo et identité

### 11.1 Nom

**Habix** — fusion de « Habit » + « ix » (suffixe tech/moderne).

### 11.2 Logo

Concept : lettre **H** stylisée intégrée dans une flamme 🔥 minimaliste.
Couleurs : gradient indigo → violet (`#818CF8` → `#C084FC`).

Le logo sera un SVG inline pour performance et personnalisation de couleur.

### 11.3 Favicon

Version simplifiée du logo (flamme seule) en SVG, pour un rendu net à toutes
les tailles.

---

## 12. Charte graphique — Résumé rapide

| Aspect | Choix |
|---|---|
| **Palette** | Indigo/violet sur fond sombre bleuté |
| **Police** | Inter (400, 500, 600, 700, 800) |
| **Coins** | 16px (cartes), 12px (boutons), full (avatars, badges) |
| **Ombres** | Subtiles, bleutées (pas noires) |
| **Animations** | Fluides, GPU-only, respectent prefers-reduced-motion |
| **Icônes** | Émojis natifs (habitudes) + Lucide (UI) |
| **Thèmes** | Sombre (défaut) / Clair / Système |
| **Responsive** | Mobile-first, bottom nav → sidebar |
| **Glass** | Bottom nav et header en glassmorphism |
| **Gamification visuelle** | Gradient XP, confettis, flamme animée, badges dorés |
