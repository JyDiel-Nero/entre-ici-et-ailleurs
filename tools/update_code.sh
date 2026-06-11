#!/bin/bash
# ═══ EIA — Mise à jour du CODE sans écraser les PUBLICATIONS ═══
#
# USAGE:
#   cd votre-repo-local/
#   bash update_code.sh /chemin/vers/nouveau-deploy/
#
# Ce script copie UNIQUEMENT les fichiers de code (index.html, admin/, 
# functions/, scripts), SANS toucher aux fichiers de données (data/).
# Vos articles, galerie, audio, œuvres et paramètres sont préservés.

SRC="${1:-.}"

if [ ! -f "$SRC/index.html" ]; then
  echo "ERREUR: index.html introuvable dans $SRC"
  echo "Usage: bash update_code.sh /chemin/vers/nouveau-deploy/"
  exit 1
fi

echo "=== EIA — Mise à jour du code ==="
echo "  Source: $SRC"
echo ""

# Fichiers de CODE à mettre à jour
echo "  Copie des fichiers de code..."
cp "$SRC/index.html" . 2>/dev/null && echo "  V index.html"
cp "$SRC/sw.js" . 2>/dev/null && echo "  V sw.js"
cp "$SRC/manifest.json" . 2>/dev/null && echo "  V manifest.json"
cp "$SRC/_redirects" . 2>/dev/null && echo "  V _redirects"
cp "$SRC/netlify.toml" . 2>/dev/null && echo "  V netlify.toml"
cp "$SRC/eia_images.py" . 2>/dev/null && echo "  V eia_images.py"
cp "$SRC/migrate_wix.py" . 2>/dev/null && echo "  V migrate_wix.py"

# Admin (CMS config + theme)
echo "  Copie admin/..."
cp -r "$SRC/admin/" admin/ 2>/dev/null && echo "  V admin/"

# Functions
echo "  Copie functions/..."
cp -r "$SRC/functions/" functions/ 2>/dev/null && echo "  V functions/"

# Netlify functions
if [ -d "$SRC/netlify/" ]; then
  cp -r "$SRC/netlify/" netlify/ 2>/dev/null && echo "  V netlify/"
fi

# GitHub workflows
if [ -d "$SRC/.github/" ]; then
  cp -r "$SRC/.github/" .github/ 2>/dev/null && echo "  V .github/"
fi

# Docs
if [ -d "$SRC/docs/" ]; then
  cp -r "$SRC/docs/" docs/ 2>/dev/null && echo "  V docs/"
fi

echo ""
echo "  === FICHIERS PRESERVES (non ecrasés) ==="
echo "  data/posts.json        (vos articles)"
echo "  data/gallery.json      (vos images)"
echo "  data/audio.json        (vos audios)"
echo "  data/oeuvres.json      (vos oeuvres)"
echo "  data/settings.json     (vos parametres)"
echo "  data/custom-sections.json"
echo "  images/                 (vos images)"
echo ""
echo "  === Mise à jour terminée ==="
echo "  Faites: git add . && git commit -m 'Mise a jour code' && git push"
