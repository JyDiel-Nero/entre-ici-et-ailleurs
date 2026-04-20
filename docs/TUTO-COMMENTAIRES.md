# 💬 Tutoriel Commentaires & Likes — EIA

## Fonctionnement

Les commentaires et likes sont stockés dans Cloudflare KV (namespace EIA_KV).
Sur Netlify, ils sont stockés dans Netlify Blobs (indépendamment).

### Poster un commentaire
1. Ouvrez un article sur le site
2. Remplissez le prénom (2+ caractères) et le commentaire (10-500 caractères)
3. Cliquez LAISSER UN COMMENTAIRE
4. Le commentaire apparaît immédiatement

### Liker un article
1. Cliquez ♡ AIMER CE TEXTE sur un article
2. Le compteur s'incrémente
3. Anti-spam : 1 like par IP par article

### Répondre en tant qu'admin
Le système détecte automatiquement si l'utilisateur est authentifié via GitHub (bearer token). Si oui, le commentaire affiche le badge AUTEUR doré.

## Modérer les commentaires

### Sur Cloudflare
1. Dashboard → Workers & Pages → KV
2. Cliquez sur le namespace EIA_KV
3. Cherchez la clé `comments:slug-de-l-article`
4. Cliquez sur la clé → modifiez le JSON → supprimez le commentaire indésirable
5. Save

### Sur Netlify
Les commentaires sont dans Netlify Blobs — accessibles uniquement via l'API ou le dashboard Netlify.

## Limites
| Limite | Valeur |
|--------|--------|
| KV lectures/jour | 100 000 |
| KV écritures/jour | 1 000 |
| Taille commentaire | 10-500 caractères |
| Anti-spam likes | 1 par IP/article |

## Important
Les commentaires Cloudflare et Netlify ne sont PAS synchronisés. Un commentaire posté sur `.pages.dev` n'apparaît pas sur `.netlify.app`.
