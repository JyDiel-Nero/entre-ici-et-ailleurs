# ⚡ Tutoriel Performance & Images — Entre ici et ailleurs

## Pourquoi optimiser les images ?

Chaque image non optimisée ralentit le chargement du site. Une photo de smartphone fait typiquement 3-8 MB. Après optimisation, elle peut descendre à 20-50 KB sans perte de qualité visible.

## Le script eia_image_optimizer.py

### Installation

```bash
pip install Pillow
```

### Usage basique

```bash
# Convertir une seule image (600px de large, qualité 50)
python3 eia_image_optimizer.py mon_image.jpg

# Convertir tout un dossier
python3 eia_image_optimizer.py mes_photos/

# Mode miniature pour les cartes blog (300px, qualité 40)
python3 eia_image_optimizer.py photo.jpg --thumb

# Image de fond avec flou léger
python3 eia_image_optimizer.py fond.jpg --width 800 --blur

# Personnaliser largeur et qualité
python3 eia_image_optimizer.py photo.jpg --width 400 --quality 60
```

### Résultat

Le script crée un fichier `.b64.txt` à côté de chaque image. Le contenu commence par `data:image/jpeg;base64,` suivi du code base64.

### Utiliser le résultat

**Dans un article (CMS)** :
```markdown
![Description](data:image/jpeg;base64,/9j/4AAQ...)
```

**Dans le HTML du site** :
```html
<img src="data:image/jpeg;base64,/9j/4AAQ..." alt="Description">
```

**Comme miniature dans posts.json** :
Collez le contenu du .b64.txt dans le champ `thumb` de l'article.

## Tailles recommandées

| Usage | Largeur | Qualité | Poids typique |
|-------|---------|---------|---------------|
| Miniature carte blog | 300px | 40 | 10-20 KB |
| Image dans article | 600px | 50 | 20-50 KB |
| Image de couverture | 800px | 55 | 40-80 KB |
| Fond de site | 800px | 40 + blur | 15-30 KB |
| Galerie Univers | 400px | 50 | 15-30 KB |

## Bonnes pratiques de performance

1. **Toujours optimiser avant d'uploader** — ne jamais mettre une photo brute de 5 MB
2. **Utiliser des URLs Wix/CDN** plutôt que des images locales quand possible
3. **Les images base64 sont idéales** pour les miniatures et petites images (< 50 KB)
4. **Pour les grandes images** (couvertures), préférer une URL externe (PostImages, Cloudinary)
5. **Le format JPEG** est meilleur que PNG pour les photos (5-10x plus léger)
6. **WebP** est encore plus léger mais moins compatible — JPEG reste le choix sûr

## Maintenance régulière

- Vérifiez la vitesse du site avec [PageSpeed Insights](https://pagespeed.web.dev)
- Visez un score > 80 sur mobile
- Si le score baisse, vérifiez la taille des images récentes
- Le site utilise `loading="lazy"` et `decoding="async"` — les images hors écran ne bloquent pas le chargement
