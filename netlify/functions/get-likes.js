/* ════════════════════════════════════════════════════════════════
   GET-LIKES — Netlify Function
   GET ?slug=chemin
   Retourne { slug, count }
   ════════════════════════════════════════════════════════════════ */

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const slug = event.queryStringParameters && event.queryStringParameters.slug;

  if (!slug) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Paramètre slug requis" }),
    };
  }

  try {
    const store = getStore("eia-likes");
    let data = { count: 0 };

    try {
      const raw = await store.get(`likes:${slug}`);
      if (raw) data = JSON.parse(raw);
    } catch (_) { /* pas encore de likes */ }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ slug, count: data.count || 0 }),
    };
  } catch (err) {
    console.error("get-likes error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
