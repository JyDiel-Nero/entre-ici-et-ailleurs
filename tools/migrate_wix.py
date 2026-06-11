#!/usr/bin/env python3
"""
EIA — Migration Wix vers local

USAGE:
  cd deploy/
  pip install Pillow requests
  python migrate_wix.py

OU depuis n'importe ou:
  python C:\deploy\migrate_wix.py

Le script detecte automatiquement le dossier deploy.
"""
import os, sys, re, json
from io import BytesIO

try:
    import requests
except ImportError:
    print("Installez requests: pip install requests")
    sys.exit(1)
try:
    from PIL import Image
except ImportError:
    print("Installez Pillow: pip install Pillow")
    sys.exit(1)

# ═══ Auto-detect deploy directory ═══
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEPLOY_DIR = SCRIPT_DIR  # Script is inside deploy/

# Check if we're in the right place
def find_deploy_root():
    """Find the deploy root by looking for data/posts.json"""
    candidates = [
        SCRIPT_DIR,
        os.getcwd(),
        os.path.join(SCRIPT_DIR, 'deploy'),
        os.path.join(os.getcwd(), 'deploy'),
        os.path.dirname(SCRIPT_DIR),
    ]
    for d in candidates:
        if os.path.exists(os.path.join(d, 'data', 'posts.json')):
            return d
        if os.path.exists(os.path.join(d, 'data', 'gallery.json')):
            return d
        if os.path.exists(os.path.join(d, 'index.html')):
            return d
    return None


OUT = "images/content"
FILES = ["data/posts.json", "data/gallery.json", "index.html"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

SIZES = {
    "w_400": (400, 50),
    "w_580": (580, 50),
    "w_980": (700, 50),
}

def get_size(url):
    for k, (w, q) in SIZES.items():
        if k in url: return w, q
    return 600, 50

def to_rgb(img):
    if img.mode in ('RGBA','P','LA'):
        bg = Image.new('RGB', img.size, (3,5,10))
        try: bg.paste(img, mask=img.split()[-1])
        except: bg.paste(img.convert('RGB'))
        return bg
    return img.convert('RGB') if img.mode != 'RGB' else img

def download(url):
    """Try multiple URL variants to download."""
    variants = [
        url,
        url.replace(",enc_avif","").replace(",quality_auto",""),
    ]
    # Also try base media URL without /v1/fill/
    m = re.search(r'(https://static\.wixstatic\.com/media/[^/]+)', url)
    if m:
        variants.append(m.group(1))
    
    for u in variants:
        try:
            r = requests.get(u, headers=UA, timeout=20)
            if r.status_code == 200 and len(r.content) > 500:
                return r.content
        except Exception as e:
            pass
    return None

def optimize(data, max_w, quality):
    img = to_rgb(Image.open(BytesIO(data)))
    w, h = img.size
    if w > max_w:
        img = img.resize((max_w, int(h * max_w / w)), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, 'JPEG', quality=quality, optimize=True, progressive=True)
    return buf.getvalue()


def main():
    print("\n=== EIA -- Migration Wix ===\n")

    # Find deploy root
    root = find_deploy_root()
    if not root:
        print("  X Impossible de trouver le dossier deploy!")
        print()
        print("  Le script cherche data/posts.json, data/gallery.json, index.html")
        print("  dans les emplacements suivants:")
        print(f"    - Dossier du script : {SCRIPT_DIR}")
        print(f"    - Dossier courant   : {os.getcwd()}")
        print()
        print("  Solutions:")
        print('    1. cd dans le dossier deploy, puis: python migrate_wix.py')
        print('    2. Placez ce script dans le dossier deploy/')
        print()
        
        # List what we DO find
        for d in [SCRIPT_DIR, os.getcwd()]:
            print(f"  Contenu de {d}:")
            try:
                for f in sorted(os.listdir(d))[:15]:
                    print(f"    {f}")
            except:
                print("    (acces refuse)")
            print()
        sys.exit(1)

    print(f"  Dossier deploy : {root}")
    os.chdir(root)

    # Create output dir
    os.makedirs(OUT, exist_ok=True)

    # Collect all URLs
    all_urls = set()
    contents = {}
    found_files = 0
    
    for f in FILES:
        fpath = os.path.join(root, f)
        if not os.path.exists(fpath):
            print(f"  ! Fichier absent: {f}")
            continue
        c = open(fpath, encoding='utf-8').read()
        found_files += 1
        wix_urls = re.findall(r'https://static\.wixstatic\.com/media/[^"\')\s\\]+', c)
        all_urls.update(wix_urls)
        contents[fpath] = c

    print(f"  Fichiers trouves : {found_files}/{len(FILES)}")
    print(f"  URLs Wix trouvees : {len(all_urls)}")
    
    if not all_urls:
        if found_files == 0:
            print("\n  X Aucun fichier de donnees trouve!")
            print(f"    Verifiez que {root} contient data/posts.json")
        else:
            print("\n  Aucune URL Wix dans les fichiers.")
            print("  Soit la migration est deja faite, soit les fichiers ne contiennent pas de liens Wix.")
            # Show a sample of what's in the files
            for fpath, c in contents.items():
                urls_found = re.findall(r'https?://[^\s"\')+]+', c)[:3]
                if urls_found:
                    print(f"\n  URLs trouvees dans {os.path.basename(fpath)}:")
                    for u in urls_found:
                        print(f"    {u[:80]}")
        sys.exit(0)

    # Group by image ID
    groups = {}
    for u in all_urls:
        m = re.search(r'(1c1089_[a-f0-9]+~mv2)\.(jpg|jpeg|png)', u)
        if m:
            groups.setdefault(m.group(1), []).append(u)
        else:
            # Unknown pattern
            h = hash(u) % 100000
            groups.setdefault(f"img_{h}", []).append(u)

    print(f"  Images uniques : {len(groups)}\n")

    mapping = {}
    ok = 0
    fail = 0

    for i, (img_id, urls) in enumerate(sorted(groups.items()), 1):
        sys.stdout.write(f"  [{i}/{len(groups)}] {img_id[:35]}... ")
        sys.stdout.flush()
        
        # Download best quality
        best = sorted(urls, key=lambda u: -int(re.search(r'w_(\d+)',u).group(1)) if re.search(r'w_(\d+)',u) else 0)
        data = None
        for u in best:
            data = download(u)
            if data: break
        
        if not data:
            print("ERREUR (telechargement impossible)")
            fail += 1
            continue

        # Create optimized versions
        first = True
        for url in urls:
            max_w, quality = get_size(url)
            slug = img_id.replace("1c1089_","").replace("~mv2","")[:12]
            fname = f"{slug}_{max_w}w.jpg"
            fpath = os.path.join(OUT, fname)
            local = f"/images/content/{fname}"

            if not os.path.exists(fpath):
                try:
                    opt = optimize(data, max_w, quality)
                    with open(fpath, 'wb') as f: f.write(opt)
                    if first:
                        print(f"OK ({len(opt)//1024} KB)")
                        first = False
                except Exception as e:
                    with open(fpath, 'wb') as f: f.write(data)
                    if first:
                        print(f"brut ({len(data)//1024} KB)")
                        first = False
            else:
                if first:
                    print("deja fait")
                    first = False

            mapping[url] = local
        ok += 1

    # Replace in files
    print(f"\n  Remplacement des URLs...")
    for fpath, c in contents.items():
        orig = c
        for old, new in mapping.items():
            c = c.replace(old, new)
        if c != orig:
            open(fpath, 'w', encoding='utf-8').write(c)
            left = c.count("wixstatic.com")
            print(f"  V {os.path.basename(fpath)} (Wix restants: {left})")
        else:
            print(f"  - {os.path.basename(fpath)} (inchange)")

    # Summary
    img_files = [f for f in os.listdir(OUT) if f.endswith('.jpg')] if os.path.exists(OUT) else []
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in img_files)
    
    print(f"\n  === Resultat ===")
    print(f"  Images OK: {ok}/{len(groups)}")
    print(f"  Echecs: {fail}")
    print(f"  Fichiers: {len(img_files)} dans {OUT}/")
    print(f"  Taille totale: {total//1024} KB")

    remain = 0
    for f in FILES:
        fp = os.path.join(root, f)
        if os.path.exists(fp):
            remain += open(fp, encoding='utf-8').read().count("wixstatic")

    if remain:
        print(f"\n  ! {remain} liens Wix restants (telechargement echoue)")
        print(f"    Telechargez-les manuellement depuis votre navigateur")
    else:
        print(f"\n  V Tous les liens Wix remplaces!")

    if fail:
        print(f"\n  Pour les {fail} images echouees:")
        print(f"    1. Ouvrez le lien Wix dans votre navigateur")
        print(f"    2. Clic droit > Enregistrer l'image sous... > dans {OUT}/")
        print(f"    3. Mettez a jour le lien dans data/posts.json ou gallery.json")
    print()


if __name__ == "__main__":
    main()
