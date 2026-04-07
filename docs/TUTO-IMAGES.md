# 🖼️ Tutoriel Images — Entre ici et ailleurs

## Comment fonctionnent les images

Le site utilise deux types d'images :

1. **Images locales** : stockées dans `images/uploads/` de votre dépôt GitHub
2. **Images externes** : hébergées sur un CDN (URL directe)

## Uploader une image via le CMS

1. Accédez au CMS (`/admin`)
2. Lors de l'édition d'un article, cliquez sur le champ image (couverture ou miniature)
3. Cliquez **Choose an image** → **Upload**
4. Sélectionnez votre image depuis votre ordinateur
5. L'image sera automatiquement uploadée dans `images/uploads/` sur GitHub

## Formats recommandés

| Usage | Taille recommandée | Format |
|-------|-------------------|--------|
| Couverture article | 1200 × 630 px | JPG ou WebP |
| Miniature carte | 580 × 330 px | JPG ou WebP |
| Image inline | 800 px de large max | JPG, PNG ou WebP |
| Galerie Univers | 800 × 600 px min | JPG ou WebP |

## Optimiser les images

Les images lourdes ralentissent le site. Avant d'uploader :

1. Redimensionnez à la taille nécessaire (pas besoin de 4000px pour une miniature)
2. Compressez avec [squoosh.app](https://squoosh.app) (gratuit, en ligne)
3. Visez un poids de 100-300 Ko par image
4. Le format WebP offre la meilleure compression

## Insérer une image dans un article

Dans le contenu Markdown de l'article :

```markdown
![Description de l'image](/images/uploads/mon-image.jpg)
```

Ou avec une URL externe :
```markdown
![Description](https://exemple.com/mon-image.jpg)
```

L'image sera affichée centrée avec la description comme légende en italic doré.

## Galerie Univers

1. Dans le CMS, allez dans **🌌 Galerie Univers**
2. Cliquez **Gérer la galerie**
3. Ajoutez des images avec :
   - **Légende** : texte qui apparaît au survol
   - **Image** : uploadez ou collez une URL
   - **Ordre** : numéro pour trier (1 = premier)
4. La 1ère image sera en double hauteur, la 4ème en double largeur

## Gestion des erreurs

Si une image ne charge pas (URL cassée, fichier supprimé) :
- L'image disparaît proprement sans casser la mise en page
- C'est géré par `onerror="this.style.display='none'"` dans le code
- Les miniatures sans image affichent la première lettre du titre

## Hébergement externe d'images

Si vous préférez héberger vos images ailleurs :
- [Cloudinary](https://cloudinary.com) — plan gratuit généreux
- [Imgur](https://imgur.com) — simple et gratuit
- Copiez simplement l'URL directe de l'image dans le CMS
