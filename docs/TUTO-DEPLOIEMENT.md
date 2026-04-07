# 🚀 Tutoriel de Déploiement — Entre ici et ailleurs

## Étape 1 : Créer un compte GitHub

1. Rendez-vous sur [github.com](https://github.com) et créez un compte gratuit
2. Confirmez votre adresse email

## Étape 2 : Créer le dépôt (repository)

1. Cliquez sur le bouton **+** en haut à droite → **New repository**
2. Nom du dépôt : `entre-ici-et-ailleurs`
3. Laissez **Public** coché
4. Ne cochez **aucune** option (pas de README)
5. Cliquez **Create repository**

## Étape 3 : Uploader les fichiers

1. Sur la page du dépôt vide, cliquez **uploading an existing file**
2. Glissez-déposez **tous** les fichiers et dossiers du ZIP
3. ⚠️ **Important** : ajoutez aussi vos 2 images dans `images/` :
   - `images/clock.jpg` (l'horloge)
   - `images/template-bg.jpg` (le fond artistique)
4. Créez un fichier `.gitkeep` dans `images/uploads/`
5. Message de commit : `Premier déploiement EIA`
6. Cliquez **Commit changes**

## Étape 4 : Ajouter le package.json (CRITIQUE)

Assurez-vous que `package.json` est bien à la racine du dépôt :
```json
{
  "name": "entre-ici-et-ailleurs",
  "version": "1.0.0",
  "dependencies": {
    "@netlify/blobs": "^7.0.0"
  }
}
```
Sans ce fichier, les commentaires et likes ne fonctionneront pas.

## Étape 5 : Connecter Netlify

1. Rendez-vous sur [netlify.com](https://www.netlify.com) — créez un compte via GitHub
2. **Add new site** → **Import an existing project** → **GitHub**
3. Sélectionnez votre dépôt
4. Paramètres de build :
   - Branch : `main`
   - Build command : *(vide)*
   - Publish directory : `.`
5. Cliquez **Deploy site**

## Étape 6 : Renommer le site

1. **Site configuration** → **General** → **Site details** → **Change site name**
2. Choisissez : `entreici-et-ailleurs` → URL : `entreici-et-ailleurs.netlify.app`

## Étape 7 : Activer Identity (CRITIQUE — pour le CMS)

⚠️ **C'est l'étape qui pose le plus de problèmes. Suivez-la à la lettre.**

1. Dans Netlify, allez dans **Integrations** → cherchez **Identity** → **Enable**
2. Sous **Registration**, choisissez **Invite only**
3. Allez dans **Identity** (menu principal du site) → **Invite users** → entrez votre email
4. **Vous recevrez un email avec un lien**

### ⚠️ Le lien d'invitation

Le lien d'invitation vous redirige vers votre site avec un token dans l'URL (type `#invite_token=...`). Le script `netlify-identity-widget.js` inclus dans `index.html` intercepte ce token et ouvre automatiquement une fenêtre modale pour créer votre mot de passe.

**Si la modale ne s'ouvre pas :**
- Vérifiez que `index.html` contient bien `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>` dans le `<head>`
- Videz le cache du navigateur (Ctrl+Shift+R)
- Essayez en navigation privée
- Vérifiez que l'URL contient bien `#invite_token=` ou `#confirmation_token=`

## Étape 8 : Activer Git Gateway

1. **Integrations** → **Identity** → descendez → **Git Gateway** → **Enable**
2. C'est tout. Le CMS peut maintenant modifier les fichiers.

## Étape 9 : Vérifications post-déploiement

### Checklist complète :

| Test | URL | Attendu |
|------|-----|---------|
| Site principal | `votre-site.netlify.app` | Le blog s'affiche avec le hero horloge |
| CMS | `votre-site.netlify.app/admin` | Interface Decap CMS avec login |
| Identity | Cliquer l'email d'invitation | Modale de création de mot de passe |
| Articles | Cliquer sur un article du blog | Vue article avec texte complet |
| Commentaires | Écrire un commentaire | Soumission réussie |
| Likes | Cliquer le cœur | Compteur incrémenté |
| Fonctions | `votre-site.netlify.app/.netlify/functions/get-likes?slug=aveu` | Réponse JSON |

### Si les fonctions échouent (erreur 502) :
1. Vérifiez que `package.json` est à la racine avec `@netlify/blobs`
2. Allez dans Netlify → **Functions** → vérifiez qu'elles sont listées
3. Si elles ne sont pas listées, vérifiez que `netlify.toml` contient `functions = "netlify/functions"`

### Si les images locales ne s'affichent pas :
1. Vérifiez que `images/clock.jpg` et `images/template-bg.jpg` sont dans le dépôt GitHub
2. Les noms sont sensibles à la casse

## Étape 10 : Domaine personnalisé (optionnel)

1. Achetez un domaine (Namecheap, OVH, etc.) ou utilisez eu.org (gratuit)
2. **Domain management** → **Add custom domain**
3. Suivez les instructions DNS de Netlify
4. Le certificat SSL est automatique

---

## Problèmes fréquents et solutions

| Problème | Solution |
|----------|----------|
| Lien d'invitation → pas de modale | Vérifier le script Identity Widget dans index.html |
| CMS page blanche | Vider le cache, vérifier Git Gateway activé |
| « Failed to persist entry » dans le CMS | Git Gateway non activé ou Identity non configuré |
| Commentaires « indisponibles » | package.json manquant ou @netlify/blobs absent |
| Deploy échoue | Vérifier les logs dans Netlify → Deploys |
| Images manquantes | Fichiers non uploadés sur GitHub ou mauvais chemin |

---

**Votre site est en ligne !** 🎉
