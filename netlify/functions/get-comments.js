/* ════════════════════════════════════════════════════════════════
   GET-COMMENTS — Netlify Function
   GET ?slug=chemin
   Retourne { slug, comments: [...] } triés par date croissante
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
    const store = getStore("eia-comments");
    let data = { comments: [] };

    try {
      const raw = await store.get(`comments:${slug}`);
      if (raw) data = JSON.parse(raw);
    } catch (_) { /* pas encore de commentaires */ }

    /* Trier par date croissante et filtrer les approuvés */
    const approved = (data.comments || [])
      .filter((c) => c.approved !== false)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ slug, comments: approved }),
    };
  } catch (err) {
    console.error("get-comments error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
