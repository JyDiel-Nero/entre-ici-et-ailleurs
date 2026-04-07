/* ════════════════════════════════════════════════════════════════
   ADD-COMMENT — Netlify Function
   POST { slug, name, text }
   Validation + sanitize + stockage Netlify Blobs
   ════════════════════════════════════════════════════════════════ */

const { getStore } = require("@netlify/blobs");

/* Sanitize : supprime toutes les balises HTML */
function stripTags(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const { slug, name, text } = JSON.parse(event.body || "{}");

    /* ── Validation ── */
    const cleanName = stripTags(name || "");
    const cleanText = stripTags(text || "");

    if (cleanName.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Le prénom doit contenir au moins 2 caractères." }),
      };
    }
    if (cleanText.length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Le commentaire doit contenir au moins 10 caractères." }),
      };
    }
    if (cleanText.length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Le commentaire ne doit pas dépasser 500 caractères." }),
      };
    }
    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Slug requis." }),
      };
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
    };

    data.comments.push(comment);
    await store.set(key, JSON.stringify(data));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(comment),
    };
  } catch (err) {
    console.error("add-comment error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
