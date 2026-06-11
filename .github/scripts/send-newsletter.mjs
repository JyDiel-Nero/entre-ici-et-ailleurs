/**
 * send-newsletter.mjs — JyDiel In-Time
 *
 * Détecte les textes nouvellement publiés dans data/posts.json et envoie
 * une campagne MailerLite par texte (création + envoi immédiat).
 *
 * Mémoire : .github/newsletter-state.json — liste des slugs déjà notifiés.
 * Premier passage : initialise l'état avec tous les textes existants,
 * N'ENVOIE RIEN, et s'arrête (protection anti-spam de l'archive).
 *
 * Garde-fous :
 *  - maximum 3 envois par exécution (MAX_PER_RUN)
 *  - textes programmés (publishDate future) ignorés jusqu'à leur date
 *  - DRY_RUN=true : tout afficher, ne rien envoyer, ne pas modifier l'état
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITE = 'https://jydielintime.com';
const API = 'https://connect.mailerlite.com/api';
const STATE_PATH = '.github/newsletter-state.json';
const POSTS_PATH = 'data/posts.json';
const TEMPLATE_PATH = '.github/templates/nouvelle-publication.html';
const MAX_PER_RUN = 3;

const TOKEN = process.env.MAILERLITE_API_TOKEN;
const GROUP_ID = (process.env.MAILERLITE_GROUP_ID || '').trim();
const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true';

/* ── Utilitaires ─────────────────────────────────────────────── */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Un texte est « publiable » si non dépublié et si sa date de
   publication (quand elle existe et est lisible) est passée. */
function isLive(post) {
  if (post.published === false) return false;
  if (post.publishDate) {
    const t = Date.parse(post.publishDate);
    if (!Number.isNaN(t) && t > Date.now()) return false;
  }
  return true;
}

async function ml(path, method, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* réponse non-JSON */ }
  if (!res.ok) {
    throw new Error(`MailerLite ${method} ${path} → HTTP ${res.status} : ${text.slice(0, 500)}`);
  }
  return json;
}

/* ── Gabarit HTML de l'email ─────────────────────────────────
   Utilise le gabarit officiel EIA (.github/templates/) avec ses
   variables *|TITRE|*, *|DATE|*, *|CATEGORIE|*, *|EXTRAIT|*, *|LIEN|*.
   Si le gabarit est absent, un gabarit minimal de secours est utilisé. */

function renderTemplate(post) {
  const url = `${SITE}/article/${encodeURIComponent(post.slug)}`;
  /* Couverture optionnelle : insérée seulement si le texte en a une */
  let cover = '';
  if (post.cover) {
    let c = String(post.cover).trim();
    if (!/^https?:\/\//.test(c)) c = SITE + (c.charAt(0) === '/' ? '' : '/') + c;
    cover = `<img src="${esc(c)}" alt="" width="532" style="display:block;width:100%;max-width:532px;height:auto;margin:0 auto 28px;border:1px solid rgba(232,201,138,0.25);">`;
  }
  const vars = {
    'TITRE': esc(post.title || ''),
    'DATE': esc(post.date || ''),
    'CATEGORIE': esc(post.tag || ''),
    /* L'extrait garde ses retours à la ligne (strophes) */
    'EXTRAIT': esc(post.excerpt || '').replace(/\n/g, '<br>'),
    'LIEN': url,
    'COUVERTURE': cover,
  };

  if (existsSync(TEMPLATE_PATH)) {
    let html = readFileSync(TEMPLATE_PATH, 'utf8');
    for (const [key, val] of Object.entries(vars)) {
      html = html.split(`*|${key}|*`).join(val);
    }
    return html;
  }

  /* Secours minimal si le gabarit a disparu du repo */
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#03050A;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:Georgia,serif;text-align:center;">
    <p style="font-size:10px;letter-spacing:0.3em;color:#C9A96E;">NOUVELLE PUBLICATION</p>
    <h1 style="font-weight:normal;color:#F0D99A;">${vars.TITRE}</h1>
    <p style="font-size:12px;color:#A8884E;">${vars.DATE} · ${vars.CATEGORIE}</p>
    <p style="font-style:italic;color:rgba(232,201,138,0.7);line-height:2;">${vars.EXTRAIT}</p>
    <p><a href="${url}" style="display:inline-block;border:1px solid #F0D99A;padding:14px 36px;color:#F0D99A;text-decoration:none;font-size:11px;letter-spacing:0.15em;">LIRE LE TEXTE COMPLET</a></p>
    <p style="font-size:9px;"><a href="{$unsubscribe}" style="color:rgba(232,201,138,0.5);">Se désabonner</a></p>
  </div></body></html>`;
}

/* ── Programme principal ─────────────────────────────────────── */

async function main() {
  const posts = (JSON.parse(readFileSync(POSTS_PATH, 'utf8')).posts || []);
  const live = posts.filter(p => p && p.slug && isLive(p));

  /* Bootstrap : pas d'état → mémoriser l'existant, ne rien envoyer */
  if (!existsSync(STATE_PATH)) {
    const state = {
      initialized: new Date().toISOString(),
      note: 'Slugs déjà notifiés (ou antérieurs à la mise en place de la newsletter automatique).',
      sent: live.map(p => p.slug),
    };
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
    console.log(`Premier passage : état initialisé avec ${state.sent.length} texte(s) existant(s). Aucun envoi.`);
    return;
  }

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  const sent = new Set(state.sent || []);
  const fresh = live.filter(p => !sent.has(p.slug));

  if (!fresh.length) {
    console.log('Aucun nouveau texte à annoncer.');
    return;
  }

  /* Du plus ancien au plus récent, plafonné */
  const batch = fresh.slice(-MAX_PER_RUN).reverse();
  if (fresh.length > MAX_PER_RUN) {
    console.log(`⚠ ${fresh.length} nouveaux textes détectés ; envoi plafonné à ${MAX_PER_RUN} par exécution (le reste partira aux prochains passages).`);
  }

  if (!TOKEN && !DRY_RUN) {
    throw new Error('Secret MAILERLITE_API_TOKEN manquant.');
  }

  for (const post of batch) {
    const name = `Auto · Nouveau texte · ${post.slug}`;
    console.log(`→ ${DRY_RUN ? '[DRY RUN] ' : ''}Campagne « ${post.title} » (${post.slug})`);

    if (DRY_RUN) continue;

    const payload = {
      name,
      type: 'regular',
      language_id: 6, /* français */
      emails: [{
        subject: `Nouvelle publication — ${post.title}`,
        from_name: 'JyDiel In-Time',
        from: 'contact@jydielintime.com',
        content: renderTemplate(post),
      }],
    };
    if (GROUP_ID) payload.groups = [GROUP_ID];

    const created = await ml('/campaigns', 'POST', payload);
    const id = created && created.data && created.data.id;
    if (!id) throw new Error('Création de campagne : ID introuvable dans la réponse.');
    console.log(`   Campagne créée (id ${id}), envoi immédiat…`);

    await ml(`/campaigns/${id}/schedule`, 'POST', { delivery: 'instant' });
    console.log('   ✓ Envoyée.');

    /* Mémoriser immédiatement (si un envoi suivant échoue,
       celui-ci ne sera pas ré-envoyé) */
    sent.add(post.slug);
    state.sent = Array.from(sent);
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  }

  console.log(DRY_RUN ? 'Dry run terminé — état non modifié.' : 'Terminé.');
}

main().catch(err => {
  console.error('ERREUR :', err.message || err);
  process.exit(1);
});
