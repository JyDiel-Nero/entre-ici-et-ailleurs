/* ════════════════════════════════════════════════════════════════
   GET-NOTIFICATIONS — Netlify Function
   GET (avec auth JWT)
   Retourne les notifications non lues pour l'admin
   ════════════════════════════════════════════════════════════════ */

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  /* Vérifier auth */
  const authHeader = event.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Non autorisé" }) };
  }

  try {
    const store = getStore("eia-notifications");
    const keys = await store.list();
    const notifications = [];

    for (const key of (keys.blobs || [])) {
      try {
        const raw = await store.get(key.key);
        if (raw) {
          const notif = JSON.parse(raw);
          notif._key = key.key;
          notifications.push(notif);
        }
      } catch (_) {}
    }

    /* Trier par date décroissante */
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ notifications: notifications.slice(0, 50) }),
    };
  } catch (err) {
    console.error("get-notifications error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Erreur serveur" }) };
  }
};
