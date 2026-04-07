# 🔧 Tutoriel d'Amélioration — Entre ici et ailleurs

## Modifier les couleurs

Toutes les couleurs sont définies dans les variables CSS au début de `index.html` :

```css
:root {
  --deep:  #03050A;   /* fond le plus sombre */
  --night: #060D18;   /* sections sombres */
  --ink:   #0D1D2C;   /* sections medium */
  --mid:   #0A1624;   /* sections intermédiaires */
  --gold:  #C9A96E;   /* or primaire — couleur principale */
  --g2:    #E8C98A;   /* or clair — titres, accents */
  --g3:    #A8884E;   /* or foncé — labels, dates */
  --txt:   rgba(201,169,110,.6);  /* texte courant */
  --txt2:  rgba(201,169,110,.85); /* texte important */
}
```

Pour changer la palette, modifiez ces valeurs. Par exemple, pour un thème bleu :
- Remplacez `--gold: #C9A96E` par `--gold: #6E9DC9`
- Adaptez `--g2` et `--g3` en conséquence
- Modifiez les `rgba(201,169,110,…)` avec les nouvelles valeurs RGB

## Changer les polices

Les polices sont chargées depuis Google Fonts dans le `<head>` :

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@...&family=Merriweather:ital,wght@...&display=swap" rel="stylesheet">
```

1. Rendez-vous sur [fonts.google.com](https://fonts.google.com)
2. Choisissez vos polices
3. Copiez le lien `<link>` fourni par Google
4. Remplacez le lien existant dans `index.html`
5. Mettez à jour les variables :
```css
--ff-t: 'Votre Police Titre', Georgia, serif;
--ff-b: 'Votre Police Corps', Georgia, serif;
```

## Ajouter une nouvelle vue/page

### 1. Ajouter le HTML

Dans `index.html`, ajoutez un nouveau bloc `<div class="view">` avant le footer :

```html
<div class="view" id="v-mapage">
  <section class="ph s-deep">
    <div class="wrap tac">
      <p class="t-label rv">MON LABEL</p>
      <h2 class="t-title xl rv d1">Ma Page</h2>
      <p class="t-italic rv d2">Sous-titre de ma page.</p>
    </div>
  </section>
  <section class="s-night">
    <div class="wrap">
      <!-- Votre contenu ici -->
    </div>
  </section>
</div>
```

### 2. Ajouter le lien de navigation

Dans la navbar et le footer, ajoutez :
```html
<a data-page="mapage">Ma Page</a>
```

Le routeur JavaScript gère automatiquement le reste grâce à l'attribut `data-page`.

## Modifier les textes statiques

Les textes éditables (tagline, manifeste, biographie) sont dans `data/settings.json`. Vous pouvez les modifier :

- **Via le CMS** : allez dans `/admin` → ⚙️ Paramètres → Textes du site
- **Via GitHub** : éditez directement `data/settings.json`

## Ajouter un nouveau champ à un article

### 1. Modifier `admin/config.yml`

Sous la liste des champs de `posts`, ajoutez :
```yaml
- { name: mon_champ, widget: string, label: "Mon nouveau champ", required: false }
```

Types de widgets disponibles : `string`, `text`, `markdown`, `image`, `boolean`, `number`, `select`, `date`.

### 2. Modifier `data/posts.json`

Ajoutez le champ à chaque article existant :
```json
{
  "slug": "mon-article",
  "mon_champ": "valeur par défaut",
  ...
}
```

### 3. Utiliser le champ dans le JavaScript

Dans la fonction `renderArticle` de `index.html`, accédez au champ avec `post.mon_champ`.

## Intégrer un flux RSS

Ajoutez dans le `<head>` de `index.html` :
```html
<link rel="alternate" type="application/rss+xml" title="EIA — Flux RSS" href="/feed.xml">
```

Pour générer le fichier `feed.xml`, créez un script ou utilisez un service comme [RSS.app](https://rss.app) qui peut générer un flux à partir de votre `posts.json`.

Exemple de `feed.xml` statique (à régénérer manuellement ou via un script) :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Entre ici et ailleurs</title>
    <link>https://votre-site.netlify.app</link>
    <description>Blog de poésie, prière et méditation par J.Y.D.</description>
    <item>
      <title>Titre de l'article</title>
      <link>https://votre-site.netlify.app/#article/slug</link>
      <description>Extrait…</description>
      <pubDate>Mon, 01 Jan 2025 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
```

## Ajouter Google Analytics

1. Créez un compte sur [analytics.google.com](https://analytics.google.com)
2. Obtenez votre ID de mesure (format `G-XXXXXXXXXX`)
3. Ajoutez avant la fermeture de `</head>` dans `index.html` :

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Ajouter Plausible Analytics (alternative respectueuse)

[Plausible](https://plausible.io) est une alternative légère et respectueuse de la vie privée.

1. Créez un compte sur plausible.io
2. Ajoutez dans le `<head>` :
```html
<script defer data-domain="votre-site.netlify.app" src="https://plausible.io/js/script.js"></script>
```

## Personnaliser le curseur

Le curseur personnalisé (point doré + anneau) est défini dans les styles CSS sous `#cur-dot` et `#cur-ring` :

- Modifier la taille : changez `width` et `height`
- Modifier la couleur : changez `background` ou `border`
- Désactiver : supprimez la section CSS `@media(hover:hover)` et la fonction `initCursor()` dans le JavaScript

## Ajouter des réseaux sociaux

1. Ajoutez le lien Instagram dans le CMS (⚙️ Paramètres → Instagram)
2. Dans `index.html`, vous pouvez ajouter des icônes dans le footer :

```html
<div class="footer-social">
  <a href="https://instagram.com/VOTRE-COMPTE" target="_blank" rel="noopener">Instagram</a>
</div>
```

## Modifier la vitesse des animations

Les animations sont contrôlées par :
- `--ease: cubic-bezier(.25,.46,.45,.94)` — la courbe d'accélération
- `.rv` transition : `0.7s` — durée du scroll reveal
- Les délais `.d1` à `.d4` : `130ms` à `580ms`

Pour des animations plus lentes, augmentez ces valeurs. Pour plus rapides, diminuez-les.
