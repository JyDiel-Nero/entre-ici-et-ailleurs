# 🖼️ Tutoriel Images — Optimisation et utilisation

## Les deux fichiers produits

Quand vous optimisez une image avec `eia_images.py`, le script crée deux fichiers :

| Fichier | Contenu | Poids |
|---------|---------|-------|
| `photo.optimized.jpg` | Image JPEG compressée | ~10-50 KB |
| `photo.b64.txt` | La même image en texte base64 | ~30% plus lourd |

## Quand utiliser quoi

### .optimized.jpg — pour les grandes images

**Méthode A — Via GitHub (recommandé)**
1. Copiez le `.optimized.jpg` dans `images/content/` de votre dépôt
2. Commit + push sur GitHub
3. Référencez avec `/images/content/photo.optimized.jpg`

**Méthode B — Via un hébergeur externe**
1. Allez sur [PostImages.org](https://postimages.org) (gratuit, sans compte)
2. Uploadez le `.optimized.jpg`
3. Copiez le "Direct link" (URL finissant par `.jpg`)
4. Collez cette URL dans le CMS ou le JSON

### .b64.txt — pour les petites images (< 50 KB)

1. Ouvrez le fichier `.b64.txt` avec un éditeur de texte
2. Sélectionnez TOUT le contenu (Ctrl+A)
3. Copiez (Ctrl+C)
4. Collez directement dans un champ image du CMS ou du JSON

Le contenu ressemble à : `data:image/jpeg;base64,/9j/4AAQSkZJRg...`

Le navigateur affiche l'image directement sans aller chercher un serveur externe.

## Utiliser une image dans un article (Markdown)

Dans le champ "Contenu" d'un article du CMS, ou dans le `body` du JSON :

```markdown
Texte du poème avant l'image...

![Description de l'image](/images/content/mon-image.optimized.jpg)

Texte du poème après l'image...
```

**Avec une URL externe :**
```markdown
![Coucher de soleil](https://i.postimg.cc/xxxx/photo.jpg)
```

**Avec du base64 (petites images uniquement) :**
```markdown
![Icône](data:image/jpeg;base64,/9j/4AAQ...)
```

## Utiliser une image dans le CMS

### Miniature d'article (champ Miniature)
- Collez le chemin local : `/images/content/photo_580w.jpg`
- OU collez l'URL PostImages
- OU collez le contenu du `.b64.txt`

### Image de couverture
- Même chose que miniature

### Image de la galerie Univers
- CMS → 🌌 Galerie → champ "Image"
- Collez le chemin : `/images/content/photo_400w.jpg`

### Image de fond (Hero ou globale)
- CMS → ⚙️ Général → "Image de fond Hero"
- Collez l'URL ou le chemin local

## Optimiser un lot d'images

```bash
# Un seul fichier
python eia_images.py photo.jpg

# Tout un dossier
python eia_images.py C:\mes_photos

# Mode miniature (300px)
python eia_images.py photo.jpg --mode thumb

# Mode galerie (400px)
python eia_images.py C:\mes_photos --mode galerie

# Mode couverture (800px)
python eia_images.py photo.jpg --mode cover

# Mode fond d'écran (800px + flou)
python eia_images.py photo.jpg --mode fond
```

## Tailles recommandées

| Usage | Mode | Largeur | Poids cible |
|-------|------|---------|-------------|
| Image dans un article | `article` | 600px | 15-40 KB |
| Miniature carte blog | `thumb` | 300px | 5-15 KB |
| Image de couverture | `cover` | 800px | 20-50 KB |
| Galerie Univers | `galerie` | 400px | 10-25 KB |
| Arrière-plan | `fond` | 800px | 15-30 KB |

## Limites GitHub

- Fichier max via navigateur : 25 MB
- Fichier max via Git : 100 MB
- Taille recommandée du dépôt : < 1 GB
- Avec des images optimisées à 10-50 KB, vous pouvez stocker des milliers d'images

## Résumé en 3 règles

1. **Toujours optimiser** avant d'utiliser une image sur le site
2. **`.optimized.jpg`** dans `images/content/` pour les images > 50 KB
3. **`.b64.txt`** collé directement pour les petites images < 50 KB
