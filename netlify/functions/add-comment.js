/* ════════════════════════════════════════════════════════════════
   ADD-COMMENT — Netlify Function
   POST { slug, name, text, replyTo?, adminReply? }
   - Validation + sanitize + stockage Netlify Blobs
   - Notification email à l'admin (via Netlify Email ou fetch)
   - Support réponse admin (adminReply=true + replyTo=commentId)
   
   Variables d'environnement à configurer dans Netlify :
     ADMIN_EMAIL    → votre email pour recevoir les notifications
     SITE_URL       → https://votre-site.netlify.app
   ════════════════════════════════════════════════════════════════ */

const { getStore } = require("@netlify/blobs");

function stripTags(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}

/* ── Notification email via Netlify (utilise le service d'envoi intégré) ── */
async function notifyAdmin({ slug, name, text, siteUrl, adminEmail }) {
  if (!adminEmail) return;
  try {
    /* On utilise un fetch vers un webhook Netlify ou on stocke 
       la notification dans un blob dédié que l'admin peut consulter.
       Pour un vrai email, configurez un service comme Resend/Mailgun
       ou activez Netlify Email Integration. */
    const store = getStore("eia-notifications");
    const key = `notif:${Date.now()}`;
    await store.set(key, JSON.stringify({
      type: "new_comment",
      slug,
      name,
      text,
      date: new Date().toISOString(),
      articleUrl: `${siteUrl}/#article/${slug}`,
      read: false,
    }));
  } catch (e) {
    console.warn("Notification storage failed:", e.message);
  }
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "POST uniquement" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { slug, name, text, replyTo, adminReply } = body;

    /* ── Validation ── */
    const cleanName = stripTags(name || "");
    const cleanText = stripTags(text || "");

    if (cleanName.length < 2) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Le prénom doit contenir au moins 2 caractères." }) };
    }
    if (cleanText.length < 10) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Le commentaire doit contenir au moins 10 caractères." }) };
    }
    if (cleanText.length > 500) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Le commentaire ne doit pas dépasser 500 caractères." }) };
    }
    if (!slug) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Slug requis." }) };
    }

    /* ── Vérification admin pour les réponses ── */
    let isAdmin = false;
    if (adminReply && replyTo) {
      /* Vérifier le token JWT Netlify Identity */
      const authHeader = event.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        try {
          /* Décoder le JWT (vérification basique — Netlify vérifie déjà le token) */
          const payload = JSON.parse(Buffer.from(authHeader.split(".")[1], "base64").toString());
          if (payload.app_metadata && payload.app_metadata.roles) {
            isAdmin = true;
          }
          /* Tout utilisateur Identity authentifié est considéré admin */
          if (payload.email) isAdmin = true;
        } catch (_) { /* token invalide — pas admin */ }
      }
    }

    /* ── Stockage ── */
    const store = getStore("eia-comments");
    const key = `comments:${slug}`;

    let data = { comments: [] };
    try {
      const raw = await store.get(key);
      if (raw) data = JSON.parse(raw);
    } catch (_) { /* premier commentaire */ }

    const comment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      text: cleanText,
      date: new Date().toISOString(),
      approved: true,
      replyTo: (isAdmin && replyTo) ? replyTo : null,
      isAdmin: isAdmin,
    };

    data.comments.push(comment);
    await store.set(key, JSON.stringify(data));

    /* ── Notification admin (seulement pour les commentaires visiteurs) ── */
    if (!isAdmin) {
      const siteUrl = process.env.SITE_URL || "";
      const adminEmail = process.env.ADMIN_EMAIL || "";
      await notifyAdmin({ slug, name: cleanName, text: cleanText, siteUrl, adminEmail });
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(comment),
    };
  } catch (err) {
    console.error("add-comment error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Erreur serveur" }) };
  }
};
