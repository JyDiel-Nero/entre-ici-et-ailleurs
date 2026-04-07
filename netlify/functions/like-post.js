/* ════════════════════════════════════════════════════════════════
   LIKE-POST — Netlify Function
   POST { slug, action: 'like'|'unlike' }
   Stocke le compteur dans Netlify Blobs (plan gratuit)
   Anti-spam : 1 like par IP par article
   ════════════════════════════════════════════════════════════════ */

const { getStore } = require("@netlify/blobs");

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
    const { slug, action } = JSON.parse(event.body || "{}");

    if (!slug || !["like", "unlike"].includes(action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "slug et action (like|unlike) requis" }),
      };
    }

    const ip = (event.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
    const store = getStore("eia-likes");
    const key = `likes:${slug}`;

    /* Lire l'état actuel */
    let data = { count: 0, ips: [] };
    try {
      const raw = await store.get(key);
      if (raw) data = JSON.parse(raw);
    } catch (_) { /* première fois */ }

    const alreadyLiked = data.ips.includes(ip);

    if (action === "like" && !alreadyLiked) {
      data.count = Math.max(0, data.count + 1);
      data.ips.push(ip);
    } else if (action === "unlike" && alreadyLiked) {
      data.count = Math.max(0, data.count - 1);
      data.ips = data.ips.filter((i) => i !== ip);
    }

    await store.set(key, JSON.stringify(data));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ slug, count: data.count }),
    };
  } catch (err) {
    console.error("like-post error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
