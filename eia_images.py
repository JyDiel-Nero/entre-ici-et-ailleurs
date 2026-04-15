#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║          EIA — Optimiseur d'images pour le blog             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Ce script convertit vos images en JPEG léger + base64       ║
║  pour les intégrer au site sans dépasser les limites de      ║
║  GitHub (25 MB par fichier via le navigateur).               ║
║                                                              ║
║  INSTALLATION :                                              ║
║    pip install Pillow                                        ║
║                                                              ║
║  USAGE :                                                     ║
║    python3 eia_images.py photo.jpg                           ║
║    python3 eia_images.py photo.jpg --mode thumb              ║
║    python3 eia_images.py photo.jpg --mode cover              ║
║    python3 eia_images.py photo.jpg --mode fond               ║
║    python3 eia_images.py dossier/                            ║
║    python3 eia_images.py photo.jpg --url                     ║
║                                                              ║
║  MODES :                                                     ║
║    article  → 600px, qualité 50 (pour les images d'article) ║
║    thumb    → 300px, qualité 40 (miniatures cartes blog)     ║
║    cover    → 800px, qualité 55 (couvertures)                ║
║    fond     → 800px, qualité 40 + flou léger (arrière-plan)  ║
║    galerie  → 400px, qualité 50 (galerie Univers)            ║
║                                                              ║
║  SORTIE :                                                    ║
║    Crée un fichier .optimized.jpg (image compressée)         ║
║    Crée un fichier .b64.txt (base64 prêt à coller)           ║
║    --url : affiche le data:URI pour coller dans le CMS       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""

import sys
import os
import argparse
import base64
import io

# Vérification de Pillow
try:
    from PIL import Image, ImageFilter, ImageEnhance
except ImportError:
    print("\n❌ Pillow n'est pas installé.")
    print("   Installez-le avec : pip install Pillow")
    print("   Ou : pip3 install Pillow")
    print("   Ou : python -m pip install Pillow\n")
    sys.exit(1)

# Modes prédéfinis
MODES = {
    "article": {"width": 600, "quality": 50, "blur": False, "desc": "Image dans un article"},
    "thumb":   {"width": 300, "quality": 40, "blur": False, "desc": "Miniature carte blog"},
    "cover":   {"width": 800, "quality": 55, "blur": False, "desc": "Image de couverture"},
    "fond":    {"width": 800, "quality": 40, "blur": True,  "desc": "Arrière-plan du site"},
    "galerie": {"width": 400, "quality": 50, "blur": False, "desc": "Image galerie Univers"},
}

def optimize_image(path, width=600, quality=50, blur=False):
    """Convertit une image en JPEG optimisé + base64."""
    try:
        img = Image.open(path)
    except Exception as e:
        print(f"  ❌ Impossible d'ouvrir {path}: {e}")
        return None

    # Convertir en RGB (supprime la transparence PNG)
    if img.mode in ('RGBA', 'P', 'LA'):
        background = Image.new('RGB', img.size, (3, 5, 10))  # fond nuit EIA
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Orientation EXIF (correction auto-rotation)
    try:
        from PIL import ExifTags
        exif = img.getexif()
        for key, val in ExifTags.TAGS.items():
            if val == 'Orientation':
                orientation = exif.get(key)
                if orientation == 3:
                    img = img.rotate(180, expand=True)
                elif orientation == 6:
                    img = img.rotate(270, expand=True)
                elif orientation == 8:
                    img = img.rotate(90, expand=True)
                break
    except Exception:
        pass

    # Redimensionner
    w, h = img.size
    if w > width:
        ratio = width / w
        new_h = int(h * ratio)
        img = img.resize((width, new_h), Image.LANCZOS)

    # Flou léger pour les fonds
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
        # Légère désaturation pour un fond plus doux
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(0.85)

    # Compression JPEG
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=quality, optimize=True, progressive=True)
    jpeg_bytes = buf.getvalue()
    b64 = base64.b64encode(jpeg_bytes).decode('ascii')

    return {
        "bytes": jpeg_bytes,
        "b64": b64,
        "size_kb": len(jpeg_bytes) / 1024,
        "original_kb": os.path.getsize(path) / 1024,
        "dimensions": img.size,
        "data_uri": f"data:image/jpeg;base64,{b64}",
    }


def process_file(path, mode_config, show_url=False):
    """Traite un fichier image."""
    result = optimize_image(
        path,
        width=mode_config["width"],
        quality=mode_config["quality"],
        blur=mode_config["blur"],
    )

    if result is None:
        return 0

    basename = os.path.splitext(path)[0]

    # Sauvegarder le JPEG optimisé
    jpg_path = basename + ".optimized.jpg"
    with open(jpg_path, 'wb') as f:
        f.write(result["bytes"])

    # Sauvegarder le base64
    b64_path = basename + ".b64.txt"
    with open(b64_path, 'w') as f:
        f.write(result["data_uri"])

    # Affichage
    ratio = (1 - result["size_kb"] / result["original_kb"]) * 100 if result["original_kb"] > 0 else 0
    print(f"  ✓ {os.path.basename(path)}")
    print(f"    Original : {result['original_kb']:.0f} KB")
    print(f"    Optimisé : {result['size_kb']:.0f} KB ({ratio:.0f}% de réduction)")
    print(f"    Dimensions : {result['dimensions'][0]}×{result['dimensions'][1]}px")
    print(f"    JPEG : {jpg_path}")
    print(f"    Base64 : {b64_path}")

    if show_url:
        print(f"\n    📋 DATA URI (à coller dans le CMS) :")
        # Tronquer pour l'affichage
        uri = result["data_uri"]
        if len(uri) > 200:
            print(f"    {uri[:100]}...{uri[-50:]}")
            print(f"    (URI complète dans {b64_path})")
        else:
            print(f"    {uri}")

    print()
    return result["size_kb"]


def main():
    parser = argparse.ArgumentParser(
        description="EIA — Optimiseur d'images pour le blog",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python3 eia_images.py photo.jpg                  # Mode article (600px)
  python3 eia_images.py photo.jpg --mode thumb     # Miniature (300px)
  python3 eia_images.py photo.jpg --mode fond      # Fond avec flou (800px)
  python3 eia_images.py photos/                    # Tout un dossier
  python3 eia_images.py photo.jpg --url            # Affiche le data:URI
  python3 eia_images.py photo.jpg -w 500 -q 60    # Personnalisé

Modes disponibles :
  article  → 600px, q50  (image dans un article)
  thumb    → 300px, q40  (miniature carte blog)
  cover    → 800px, q55  (couverture)
  fond     → 800px, q40  (arrière-plan, flou léger)
  galerie  → 400px, q50  (galerie Univers)
""")

    parser.add_argument('input', help='Image ou dossier à convertir')
    parser.add_argument('--mode', '-m', choices=list(MODES.keys()), default='article',
                        help='Mode prédéfini (défaut: article)')
    parser.add_argument('--width', '-w', type=int, help='Largeur max (écrase le mode)')
    parser.add_argument('--quality', '-q', type=int, help='Qualité JPEG 1-100 (écrase le mode)')
    parser.add_argument('--blur', '-b', action='store_true', help='Appliquer un flou léger')
    parser.add_argument('--url', '-u', action='store_true', help='Afficher le data:URI')

    args = parser.parse_args()

    # Construire la config
    config = MODES[args.mode].copy()
    if args.width:
        config["width"] = args.width
    if args.quality:
        config["quality"] = args.quality
    if args.blur:
        config["blur"] = True

    print(f"\n╔══ EIA Image Optimizer ══╗")
    print(f"  Mode : {args.mode} ({MODES[args.mode]['desc']})")
    print(f"  Largeur : {config['width']}px")
    print(f"  Qualité : {config['quality']}")
    print(f"  Flou : {'oui' if config['blur'] else 'non'}")
    print(f"╚════════════════════════╝\n")

    total_kb = 0
    extensions = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff')

    if os.path.isdir(args.input):
        files = sorted([
            os.path.join(args.input, f) for f in os.listdir(args.input)
            if f.lower().endswith(extensions) and not f.endswith('.optimized.jpg')
        ])
        if not files:
            print(f"  Aucune image trouvée dans {args.input}")
            print(f"  Formats acceptés : {', '.join(extensions)}")
            sys.exit(1)
        print(f"  Dossier : {args.input} ({len(files)} images)\n")
        for f in files:
            total_kb += process_file(f, config, args.url)
    elif os.path.isfile(args.input):
        if not args.input.lower().endswith(extensions):
            print(f"  ⚠️ Format non reconnu : {os.path.splitext(args.input)[1]}")
            print(f"  Formats acceptés : {', '.join(extensions)}")
            print(f"  On tente quand même...\n")
        total_kb = process_file(args.input, config, args.url)
    else:
        print(f"  ❌ Fichier introuvable : {args.input}")
        sys.exit(1)

    print(f"═══ Total optimisé : {total_kb:.0f} KB ═══\n")

    # Guide contextuel
    print("📖 UTILISATION DES FICHIERS PRODUITS :")
    print("────────────────────────────────────────")
    if args.mode == 'thumb':
        print("  Pour une miniature de carte blog :")
        print("  → CMS : collez l'URL du .b64.txt dans le champ 'Miniature carte'")
        print("  → JSON : collez dans le champ 'thumb' de posts.json")
    elif args.mode == 'cover':
        print("  Pour une image de couverture :")
        print("  → CMS : champ 'Image couverture' → Insérer depuis une adresse web")
        print("  → Uploadez le .optimized.jpg sur PostImages.org → collez l'URL")
    elif args.mode == 'fond':
        print("  Pour un arrière-plan :")
        print("  → CMS : Paramètres → 'Image de fond Hero' ou 'Image de fond globale'")
        print("  → Collez l'URL web du .optimized.jpg")
    elif args.mode == 'galerie':
        print("  Pour la galerie Univers :")
        print("  → CMS : Galerie Univers → champ 'Image'")
        print("  → Uploadez le .optimized.jpg ou collez une URL")
    else:
        print("  Pour une image dans un article :")
        print("  → Markdown : ![description](URL-de-l-image)")
        print("  → Uploadez le .optimized.jpg sur PostImages.org → collez l'URL")
    print()


if __name__ == '__main__':
    main()
