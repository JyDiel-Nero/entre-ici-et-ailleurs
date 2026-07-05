/**
 * L'Horloger — fondation serveur du CMS maison
 * Route : /api/cms
 *
 * Lit et écrit data/posts.json (et d'autres fichiers data/ autorisés)
 * sur GitHub, APRÈS avoir vérifié que l'appelant est bien le
 * propriétaire du dépôt. Le jeton d'identité est le jeton OAuth GitHub
 * que L'Horloger obtient déjà via /api/auth (scope repo,user) — envoyé
 * dans l'en-tête Authorization par le navigateur.
 *
 * SÉCURITÉ — points cardinaux :
 *  - Aucun secret n'est écrit dans le code : l'écriture utilise le jeton
 *    OAuth de l'utilisateur connecté (il a déjà le scope repo).
 *  - Avant toute écriture, on demande à GitHub « qui es-tu ? » (/user)
 *    et on refuse si ce n'est pas ALLOWED_LOGIN.
 *  - Seuls des fichiers d'une liste blanche sous data/ sont modifiables.
 *  - L'écriture passe par l'API Contents avec le SHA courant → refus
 *    automatique de GitHub si le fichier a changé entre-temps (pas
 *    d'écrasement d'une modification concurrente).
 *
 * Actions (méthode POST, corps JSON { action, ... }) :
 *  - { action:'whoami' }                      → { login }
 *  - { action:'read', file }                  → { content, sha }
 *  - { action:'write', file, content, sha,    → { commit, sha }
 *      message }
 *  - { action:'upsertPost', post, message }   → { sha, slugs }   (réédition/ajout d'un texte)
 *  - { action:'deletePost', slug, message }   → { sha, slugs }
 */

const OWNER  = 'JyDiel-Nero';
const REPO   = 'entre-ici-et-ailleurs';
const BRANCH = 'main';
const ALLOWED_LOGIN = 'JyDiel-Nero';   /* seul ce compte peut écrire */

/* Fichiers modifiables via L'Horloger (liste blanche stricte) */
const WRITABLE = {
  'data/posts.json': true,
  'data/audio.json': true,
  'data/gallery.json': true,
  'data/oeuvres.json': true,
  'data/settings.json': true,
  'data/sections-config.json': true,
  'data/custom-sections.json': true,
};

/* Médiathèque : dossiers et contraintes */
const IMAGE_DIR = 'images/uploads';
const MEDIA_DIR = 'media/uploads';           /* audio + vidéo de Minutes, séparés des images */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const AUDIO_EXT = /\.(mp3|m4a|ogg|wav|aac|flac)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const MEDIA_EXT = /\.(jpe?g|png|gif|webp|avif|svg|mp3|m4a|ogg|wav|aac|flac|mp4|webm|mov|m4v|ogv)$/i;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; /* 8 Mo — au-delà, GitHub Contents API devient hasardeux */
const MAX_MEDIA_BYTES = 25 * 1024 * 1024; /* 25 Mo pour audio/vidéo */

const GH = 'https://api.github.com';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/* Appel API GitHub authentifié avec le jeton de l'utilisateur */
function gh(path, token, init) {
  init = init || {};
  const headers = Object.assign({
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Horloger-CMS',
    'X-GitHub-Api-Version': '2022-11-28',
  }, init.headers || {});
  return fetch(GH + path, Object.assign({}, init, { headers: headers }));
}

/* Encodage/décodage base64 sûr pour l'UTF-8 (accents, emojis) */
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

/* Récupère et vérifie le jeton + l'identité de l'appelant */
async function requireOwner(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { error: json({ error: 'Non authentifié : jeton manquant.' }, 401) };
  const token = m[1].trim();

  let login = null;
  try {
    const res = await gh('/user', token);
    if (res.status === 401) return { error: json({ error: 'Jeton GitHub invalide ou expiré.' }, 401) };
    const u = await res.json();
    login = u && u.login;
  } catch (e) {
    return { error: json({ error: 'Vérification d\u2019identité impossible.' }, 502) };
  }
  if (!login) return { error: json({ error: 'Identité GitHub introuvable.' }, 401) };
  if (login.toLowerCase() !== ALLOWED_LOGIN.toLowerCase()) {
    return { error: json({ error: 'Compte non autorisé à publier.' }, 403) };
  }
  return { token: token, login: login };
}

/* Lit un fichier du repo → { text, sha } */
async function readFile(file, token) {
  const res = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + file + '?ref=' + BRANCH, token);
  if (res.status === 404) return { text: null, sha: null };
  if (!res.ok) throw new Error('Lecture GitHub ' + res.status);
  const data = await res.json();
  return { text: b64decode(data.content), sha: data.sha };
}

/* Écrit (crée ou met à jour) un fichier → réponse GitHub */
async function writeFile(file, text, sha, message, token) {
  const body = {
    message: message || ('Horloger : mise à jour ' + file),
    content: b64encode(text),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;   /* sha requis pour une mise à jour */
  const res = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + file, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data && data.message) || ('HTTP ' + res.status);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Méthode non autorisée.' }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: 'Corps JSON invalide.' }, 400);
  }
  const action = payload && payload.action;

  /* Toutes les actions exigent d'être le propriétaire */
  const auth = await requireOwner(request);
  if (auth.error) return auth.error;
  const token = auth.token;

  try {
    if (action === 'whoami') {
      return json({ login: auth.login });
    }

    if (action === 'read') {
      const file = payload.file;
      if (!WRITABLE[file]) return json({ error: 'Fichier non autorisé.' }, 400);
      const r = await readFile(file, token);
      return json({ content: r.text, sha: r.sha });
    }

    if (action === 'write') {
      const file = payload.file;
      if (!WRITABLE[file]) return json({ error: 'Fichier non autorisé.' }, 400);
      if (typeof payload.content !== 'string') return json({ error: 'Contenu manquant.' }, 400);
      /* Validation JSON avant écriture (on ne commite jamais un JSON cassé) */
      try { JSON.parse(payload.content); }
      catch (e) { return json({ error: 'JSON invalide, écriture refusée.' }, 400); }
      const w = await writeFile(file, payload.content, payload.sha || null, payload.message, token);
      return json({ commit: w.commit && w.commit.sha, sha: w.content && w.content.sha });
    }

    /* Réédition ou ajout d'un texte : on relit posts.json, on remplace
       l'entrée de même slug (ou on l'ajoute en tête), on réécrit. */
    if (action === 'upsertPost') {
      const post = payload.post;
      if (!post || !post.slug) return json({ error: 'Texte ou slug manquant.' }, 400);

      const r = await readFile('data/posts.json', token);
      let doc;
      try { doc = JSON.parse(r.text || '{"posts":[]}'); }
      catch (e) { return json({ error: 'posts.json actuel illisible.' }, 500); }
      if (!doc.posts) doc.posts = [];

      let found = false;
      for (let i = 0; i < doc.posts.length; i++) {
        if (doc.posts[i].slug === post.slug) {
          doc.posts[i] = Object.assign({}, doc.posts[i], post); /* préserve les champs non fournis */
          found = true;
          break;
        }
      }
      if (!found) doc.posts.unshift(post);   /* nouveau texte en tête (add_to_top) */

      const text = JSON.stringify(doc, null, 2);
      const msg = payload.message || ('Horloger : ' + (found ? 'édition' : 'ajout') + ' « ' + post.slug + ' »');
      const w = await writeFile('data/posts.json', text, r.sha, msg, token);
      return json({ sha: w.content && w.content.sha, added: !found, slugs: doc.posts.map(function (p) { return p.slug; }) });
    }

    if (action === 'deletePost') {
      const slug = payload.slug;
      if (!slug) return json({ error: 'Slug manquant.' }, 400);
      const r = await readFile('data/posts.json', token);
      let doc;
      try { doc = JSON.parse(r.text || '{"posts":[]}'); }
      catch (e) { return json({ error: 'posts.json actuel illisible.' }, 500); }
      const before = doc.posts.length;
      doc.posts = doc.posts.filter(function (p) { return p.slug !== slug; });
      if (doc.posts.length === before) return json({ error: 'Slug introuvable.' }, 404);
      const text = JSON.stringify(doc, null, 2);
      const w = await writeFile('data/posts.json', text, r.sha, payload.message || ('Horloger : suppression « ' + slug + ' »'), token);
      return json({ sha: w.content && w.content.sha, slugs: doc.posts.map(function (p) { return p.slug; }) });
    }

    /* ── MÉDIATHÈQUE ─────────────────────────────────────────── */

    /* Liste des images de images/uploads (triées, les plus récentes
       en premier via l'API Git Trees + tri sur le nom). GitHub renvoie
       jusqu'à 1000 entrées par dossier via l'API Contents. */
    if (action === 'listImages') {
      const res = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + IMAGE_DIR + '?ref=' + BRANCH, token);
      if (res.status === 404) return json({ images: [] });
      if (!res.ok) throw new Error('Liste images ' + res.status);
      const arr = await res.json();
      const files = (Array.isArray(arr) ? arr : [])
        .filter(function (f) { return f.type === 'file' && IMAGE_EXT.test(f.name); })
        .map(function (f) {
          return { name: f.name, path: '/' + f.path, size: f.size, sha: f.sha };
        })
        /* tri décroissant sur le nom : les uploads horodatés récents remontent */
        .sort(function (a, b) { return a.name < b.name ? 1 : (a.name > b.name ? -1 : 0); });
      return json({ images: files, dir: '/' + IMAGE_DIR });
    }

    /* Téléversement d'une image : contenu en base64 (déjà encodé côté
       navigateur), écrit tel quel dans images/uploads/<nom>. */
    if (action === 'uploadImage' || action === 'uploadMedia') {
      let name = (payload.name || '').trim();
      const contentB64 = payload.contentBase64;
      if (!name || typeof contentB64 !== 'string') return json({ error: 'Nom ou contenu manquant.' }, 400);

      /* Nettoyage du nom : pas de chemin, caractères sûrs */
      name = name.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9._-]/g, '-');
      const isAudio = AUDIO_EXT.test(name);
      const isVideo = VIDEO_EXT.test(name);
      const isImage = IMAGE_EXT.test(name);
      if (!isAudio && !isVideo && !isImage) return json({ error: 'Type de fichier non autorisé.' }, 400);

      /* Estimation de la taille depuis le base64 (≈ 3/4 de la longueur) */
      const approxBytes = Math.floor(contentB64.replace(/=+$/, '').length * 3 / 4);
      const isMedia = isAudio || isVideo;
      const limit = isMedia ? MAX_MEDIA_BYTES : MAX_IMAGE_BYTES;
      if (approxBytes > limit) return json({ error: isMedia ? 'Fichier trop lourd (max 25 Mo).' : 'Image trop lourde (max 8 Mo).' }, 413);

      /* Audio et vidéo → dossier média dédié ; images → dossier images */
      const dir = isMedia ? MEDIA_DIR : IMAGE_DIR;
      const path = dir + '/' + name;

      /* Éviter d'écraser un fichier existant : suffixer si collision */
      let finalPath = path, finalName = name;
      const check = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH, token);
      if (check.ok) {
        const dot = name.lastIndexOf('.');
        const stamp = '-' + Date.now().toString(36);
        finalName = (dot > 0 ? name.slice(0, dot) + stamp + name.slice(dot) : name + stamp);
        finalPath = dir + '/' + finalName;
      }

      const putRes = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + finalPath, token, {
        method: 'PUT',
        body: JSON.stringify({
          message: payload.message || ('Horloger : ' + (isMedia ? (isVideo ? 'vidéo ' : 'audio ') : 'image ') + finalName),
          content: contentB64.replace(/^data:[^,]*,/, ''),
          branch: BRANCH,
        }),
      });
      const putData = await putRes.json();
      if (!putRes.ok) {
        const err = new Error((putData && putData.message) || ('HTTP ' + putRes.status));
        err.status = putRes.status;
        throw err;
      }
      return json({ path: '/' + finalPath, name: finalName, kind: isVideo ? 'video' : (isAudio ? 'audio' : 'image'), dir: '/' + dir });
    }

    if (action === 'deleteImage') {
      const name = (payload.name || '').replace(/^.*[\\/]/, '');
      if (!name || !IMAGE_EXT.test(name)) return json({ error: 'Nom d\u2019image invalide.' }, 400);
      const path = IMAGE_DIR + '/' + name;
      const cur = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH, token);
      if (!cur.ok) return json({ error: 'Image introuvable.' }, 404);
      const curData = await cur.json();
      const delRes = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + path, token, {
        method: 'DELETE',
        body: JSON.stringify({ message: payload.message || ('Horloger : suppression image ' + name), sha: curData.sha, branch: BRANCH }),
      });
      if (!delRes.ok) { const d = await delRes.json(); throw new Error((d && d.message) || ('HTTP ' + delRes.status)); }
      return json({ deleted: true, name: name });
    }

    return json({ error: 'Action inconnue.' }, 400);

  } catch (e) {
    /* Conflit de version (le fichier a changé entre lecture et écriture) */
    if (e.status === 409) return json({ error: 'Conflit : le fichier a changé entre-temps. Rechargez et réessayez.' }, 409);
    return json({ error: 'Erreur GitHub : ' + (e.message || 'inconnue') }, 502);
  }
}
