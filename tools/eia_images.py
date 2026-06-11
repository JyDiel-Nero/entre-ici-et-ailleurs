#!/usr/bin/env python3
"""
EIA — Optimiseur d'images pour le blog

USAGE :
  python eia_images.py photo.jpg
  python eia_images.py photo.jpg --mode thumb
  python eia_images.py C:\mon_dossier
  python eia_images.py "C:\mon dossier\photos"

MODES :
  article  600px q50  (image dans un article)
  thumb    300px q40  (miniature carte blog)
  cover    800px q55  (couverture)
  fond     800px q40  (arriere-plan, flou leger)
  galerie  400px q50  (galerie Univers)
"""
import os, sys, argparse, base64
from io import BytesIO

try:
    from PIL import Image, ImageFilter, ImageEnhance
except ImportError:
    print("Installez Pillow: pip install Pillow")
    sys.exit(1)

MODES = {
    'article': {'width': 600, 'quality': 50, 'blur': False, 'desc': 'Image dans un article'},
    'thumb':   {'width': 300, 'quality': 40, 'blur': False, 'desc': 'Miniature carte blog'},
    'cover':   {'width': 800, 'quality': 55, 'blur': False, 'desc': 'Couverture'},
    'fond':    {'width': 800, 'quality': 40, 'blur': True,  'desc': 'Arriere-plan (flou)'},
    'galerie': {'width': 400, 'quality': 50, 'blur': False, 'desc': 'Galerie Univers'},
}

EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff')


def to_rgb(img):
    if img.mode in ('RGBA', 'P', 'LA'):
        bg = Image.new('RGB', img.size, (3, 5, 10))
        try:
            bg.paste(img, mask=img.split()[-1])
        except:
            bg.paste(img.convert('RGB'))
        return bg
    elif img.mode != 'RGB':
        return img.convert('RGB')
    return img


def auto_rotate(img):
    try:
        from PIL import ExifTags
        exif = img.getexif()
        for key, val in ExifTags.TAGS.items():
            if val == 'Orientation':
                o = exif.get(key)
                if o == 3: return img.rotate(180, expand=True)
                elif o == 6: return img.rotate(270, expand=True)
                elif o == 8: return img.rotate(90, expand=True)
                break
    except:
        pass
    return img


def process_file(filepath, config, show_url=False):
    filename = os.path.basename(filepath)
    dirname = os.path.dirname(filepath) or '.'

    try:
        original_size = os.path.getsize(filepath)
        img = Image.open(filepath)
        img = auto_rotate(img)
        img = to_rgb(img)

        w, h = img.size
        max_w = config['width']

        if w > max_w:
            ratio = max_w / w
            img = img.resize((max_w, int(h * ratio)), Image.LANCZOS)

        if config.get('blur'):
            img = img.filter(ImageFilter.GaussianBlur(radius=2))

        # Save optimized JPEG
        buf = BytesIO()
        img.save(buf, 'JPEG', quality=config['quality'], optimize=True, progressive=True)
        opt_bytes = buf.getvalue()
        opt_size = len(opt_bytes)

        # Output paths
        name_base = os.path.splitext(filename)[0]
        out_jpg = os.path.join(dirname, f"{name_base}.optimized.jpg")
        out_b64 = os.path.join(dirname, f"{name_base}.b64.txt")

        with open(out_jpg, 'wb') as f:
            f.write(opt_bytes)

        # Base64
        b64_str = f"data:image/jpeg;base64,{base64.b64encode(opt_bytes).decode()}"
        with open(out_b64, 'w') as f:
            f.write(b64_str)

        # Report
        reduction = max(0, 100 - (opt_size * 100 // original_size))
        new_w, new_h = img.size
        print(f"\n  V {filename}")
        print(f"    Original : {original_size // 1024} KB")
        print(f"    Optimise : {opt_size // 1024} KB ({reduction}% de reduction)")
        print(f"    Dimensions : {new_w}x{new_h}px")
        print(f"    JPEG : {out_jpg}")
        print(f"    Base64 : {out_b64}")

        if show_url:
            print(f"    data:URI : {b64_str[:80]}...")

        return opt_size / 1024

    except Exception as e:
        print(f"\n  X Erreur sur {filename}: {e}")
        return 0


def clean_path(path):
    """Fix Windows path issues: trailing backslash+quote, extra quotes."""
    # Remove wrapping quotes
    path = path.strip('"').strip("'")
    # Remove trailing backslash (Windows drag-drop adds it)
    path = path.rstrip('\\').rstrip('/')
    # Normalize
    path = os.path.normpath(path)
    return path


def find_images(directory):
    """Find all images in a directory (non-recursive)."""
    images = []
    try:
        for f in sorted(os.listdir(directory)):
            full = os.path.join(directory, f)
            if os.path.isfile(full) and f.lower().endswith(EXTENSIONS) and '.optimized.' not in f.lower():
                images.append(full)
    except PermissionError:
        print(f"  X Acces refuse au dossier: {directory}")
    except Exception as e:
        print(f"  X Erreur lecture dossier: {e}")
    return images


def main():
    parser = argparse.ArgumentParser(
        description="EIA - Optimiseur d'images",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('input', nargs='+', help='Image(s) ou dossier(s)')
    parser.add_argument('--mode', '-m', choices=list(MODES.keys()), default='article')
    parser.add_argument('--width', '-w', type=int, help='Largeur max')
    parser.add_argument('--quality', '-q', type=int, help='Qualite JPEG 1-100')
    parser.add_argument('--blur', '-b', action='store_true', help='Appliquer un flou')
    parser.add_argument('--url', '-u', action='store_true', help='Afficher le data:URI')

    args = parser.parse_args()

    config = MODES[args.mode].copy()
    if args.width: config['width'] = args.width
    if args.quality: config['quality'] = args.quality
    if args.blur: config['blur'] = True

    print(f"\n== EIA Image Optimizer ==")
    print(f"  Mode : {args.mode} ({config['desc']})")
    print(f"  Largeur : {config['width']}px")
    print(f"  Qualite : {config['quality']}")
    print(f"  Flou : {'oui' if config['blur'] else 'non'}")
    print(f"========================\n")

    total_kb = 0
    total_files = 0

    # Collect all files to process
    all_files = []
    for inp in args.input:
        inp = clean_path(inp)

        if os.path.isdir(inp):
            images = find_images(inp)
            if not images:
                print(f"  ! Aucune image trouvee dans: {inp}")
                print(f"    Formats acceptes: {', '.join(EXTENSIONS)}")
                # Check if path itself looks wrong
                if not os.path.exists(inp):
                    print(f"    Le dossier n'existe pas: {inp}")
                    # Try without trailing characters
                    alt = inp.rstrip('"').rstrip("'")
                    if alt != inp and os.path.isdir(alt):
                        print(f"    Essai avec: {alt}")
                        images = find_images(alt)
            else:
                print(f"  Dossier : {inp} ({len(images)} images)")
            all_files.extend(images)

        elif os.path.isfile(inp):
            all_files.append(inp)

        else:
            # Try common fixes
            fixed = False
            for attempt in [inp.rstrip('"'), inp.rstrip("'"), inp.replace('"', ''),
                          os.path.expanduser(inp)]:
                if os.path.exists(attempt):
                    if os.path.isdir(attempt):
                        all_files.extend(find_images(attempt))
                    else:
                        all_files.append(attempt)
                    fixed = True
                    break
            if not fixed:
                print(f"  X Fichier introuvable : {inp}")
                print(f"    Verifiez le chemin (pas de guillemet a la fin)")

    if not all_files:
        print(f"\n  Aucun fichier a traiter.")
        print(f"\n  Exemples d'utilisation:")
        print(f'    python eia_images.py photo.jpg')
        print(f'    python eia_images.py C:\\mes_photos')
        print(f'    python eia_images.py "C:\\mes photos" --mode galerie')
        sys.exit(1)

    # Process
    for f in all_files:
        kb = process_file(f, config, args.url)
        total_kb += kb
        total_files += 1

    print(f"\n== Total : {total_files} fichiers, {total_kb:.0f} KB ==\n")

    print("UTILISATION DES FICHIERS PRODUITS :")
    print("------------------------------------")
    if args.mode == 'thumb':
        print("  Miniature carte blog :")
        print("  -> CMS : champ 'Miniature' -> collez l'URL")
    elif args.mode == 'cover':
        print("  Couverture :")
        print("  -> Uploadez .optimized.jpg sur PostImages.org -> collez l'URL")
    elif args.mode == 'fond':
        print("  Arriere-plan :")
        print("  -> CMS : Parametres -> 'Image de fond'")
    elif args.mode == 'galerie':
        print("  Galerie Univers :")
        print("  -> CMS : Galerie -> champ 'Image'")
    else:
        print("  Image dans un article :")
        print("  -> Markdown : ![description](URL-de-l-image)")
        print("  -> Uploadez .optimized.jpg sur PostImages.org -> collez l'URL")
    print()


if __name__ == '__main__':
    main()
