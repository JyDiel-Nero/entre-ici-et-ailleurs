# ✍️ Tutoriel de Publication — Entre ici et ailleurs

## Accéder au CMS

1. Rendez-vous sur `https://votre-site.netlify.app/admin`
2. Connectez-vous avec votre email et mot de passe Identity
3. Vous arrivez sur le tableau de bord Decap CMS

## Créer un nouvel article

1. Dans le menu de gauche, cliquez **✍ Articles & Poèmes**
2. Cliquez **Gérer tous les articles**
3. Sous la liste "Articles", cliquez **Add posts** (ajouter un article)
4. Remplissez les champs :

### Champs expliqués

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Slug** | Identifiant unique, en minuscules avec tirets. Pas d'accents, pas d'espaces. | `mon-nouveau-poeme` |
| **Titre** | Le titre affiché sur le site | `Mon nouveau poème` |
| **Date** | Date au format texte français | `15 avril 2025` |
| **Catégorie** | Choisir parmi : MÉDITATION, POÉSIE, PRIÈRE, RÉFLEXION, RÉCIT | `POÉSIE` |
| **Extrait** | 2-3 lignes qui apparaissent sur la carte du blog | `Un poème sur la lumière…` |
| **Image couverture** | Image affichée en haut de l'article (optionnel) | Upload une image |
| **Miniature carte** | Image de la carte sur le blog (optionnel) | Upload une image |
| **Contenu complet** | Le texte de l'article en Markdown | Voir ci-dessous |
| **Publié** | Cocher pour rendre visible sur le site | ✅ |

### Écrire le contenu

Le contenu utilise le format **Markdown** :

```markdown
Première strophe du poème,
Chaque vers sur une ligne.

Deuxième strophe séparée
Par une ligne vide.

> Citation en retrait

**Texte en gras**
*Texte en italique*

![Description de l'image](url-de-l-image.jpg)
```

## Ajouter des images

### Image de couverture
1. Dans le champ "Image couverture", cliquez **Choose an image**
2. Uploadez depuis votre ordinateur ou collez une URL
3. L'image apparaîtra en haut de l'article, en pleine largeur

### Miniature
1. Dans le champ "Miniature carte", uploadez une image
2. Idéalement 580×330 pixels
3. Apparaîtra sur la carte du blog

### Images dans le texte
Dans le contenu Markdown, utilisez :
```markdown
![Ma description](https://url-de-mon-image.jpg)
```
L'image sera centrée avec une légende en italic doré.

## Publier

1. Une fois l'article terminé, assurez-vous que **Publié** est coché
2. Cliquez **Save** (sauvegarder) en haut
3. Le CMS crée un commit sur GitHub automatiquement
4. Netlify détecte le changement et redéploie en 30-60 secondes

## Modifier un article existant

1. Allez dans **✍ Articles & Poèmes** → **Gérer tous les articles**
2. Cliquez sur l'article à modifier dans la liste
3. Modifiez les champs souhaités
4. Cliquez **Save**

## Masquer un article (sans le supprimer)

1. Ouvrez l'article
2. Décochez **Publié**
3. Sauvegardez — l'article ne sera plus visible sur le site

## Supprimer un article

1. Ouvrez l'article dans la liste
2. Supprimez tous ses champs ou retirez-le de la liste
3. Sauvegardez

## Suivre le déploiement

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Cliquez sur votre site
3. L'onglet **Deploys** montre tous les déploiements
4. Un badge vert ✅ signifie que le site est à jour
5. En cas d'erreur, cliquez sur le déploiement pour voir les logs

---

**Astuce :** Après chaque sauvegarde dans le CMS, attendez environ 1 minute avant de rafraîchir le site pour voir les changements.
