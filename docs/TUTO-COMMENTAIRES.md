# 💬 Tutoriel Commentaires & Likes — Entre ici et ailleurs

## Comment fonctionnent les commentaires

Les commentaires utilisent **Netlify Blobs**, un système de stockage serverless inclus gratuitement avec Netlify. Chaque article a son propre espace de stockage identifié par son slug.

### Architecture technique

- **Stockage** : Netlify Blobs (clé `comments:{slug}`)
- **Serveur** : Netlify Functions (Node.js)
- **Client** : Requêtes AJAX sans rechargement de page
- **Validation** : côté serveur (prénom ≥ 2 caractères, texte 10-500 caractères)
- **Sécurité** : les balises HTML sont supprimées automatiquement (anti-XSS)

### Fonctions serverless

| Fonction | Méthode | Usage |
|----------|---------|-------|
| `add-comment` | POST | Ajouter un commentaire |
| `get-comments` | GET | Lire les commentaires d'un article |
| `like-post` | POST | Aimer / ne plus aimer un article |
| `get-likes` | GET | Lire le nombre de likes |

## Modérer les commentaires

### Via le dashboard Netlify

1. Connectez-vous à [app.netlify.com](https://app.netlify.com)
2. Allez sur votre site → **Blobs** (dans le menu)
3. Ouvrez le store `eia-comments`
4. Chaque clé correspond à un article : `comments:slug-de-l-article`
5. Cliquez sur une clé pour voir le JSON des commentaires
6. Pour supprimer un commentaire :
   - Copiez le JSON
   - Retirez le commentaire indésirable du tableau `comments`
   - Remplacez le contenu de la clé avec le JSON modifié

### Supprimer tous les commentaires d'un article

1. Dans Netlify Blobs, supprimez la clé `comments:slug`
2. Les commentaires disparaîtront immédiatement du site

## Système de Likes

### Fonctionnement

- Chaque visiteur peut liker un article une seule fois
- Le verrou côté serveur utilise l'adresse IP
- Côté client, `localStorage` mémorise l'état du like pour l'interface
- Un clic = like, un deuxième clic = unlike

### Données stockées

Dans Netlify Blobs, clé `likes:{slug}` :
```json
{
  "count": 5,
  "ips": ["1.2.3.4", "5.6.7.8", ...]
}
```

### Réinitialiser les likes d'un article

1. Dans Netlify Blobs, store `eia-likes`
2. Supprimez ou modifiez la clé `likes:slug`

## Mode hors-ligne / développement local

Si les fonctions Netlify ne sont pas disponibles (développement local) :
- Les commentaires affichent : "Commentaires disponibles sur le site en ligne."
- Les likes restent à 0
- Le site ne casse pas — tous les appels ont des fallbacks

## Désactiver les commentaires

Pour désactiver les commentaires sur tout le site, vous pouvez commenter ou supprimer la section commentaires dans le code de la fonction `renderArticle` dans `index.html`.

Pour un article spécifique, vous pourriez ajouter un champ `comments_enabled` dans `config.yml` et `posts.json`, puis conditionner l'affichage dans le JavaScript.
