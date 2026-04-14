/* ════════════════════════════════════════════════════════════════
   ADD-COMMENT — Cloudflare Pages Function
   POST /api/add-comment { slug, name, text, replyTo?, adminReply? }
   Stockage : Cloudflare KV (namespace EIA_KV)
   ════════════════════════════════════════════════════════════════ */

function stripTags(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}

export async function onRequestPost(context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const body = await context.request.json();
    const { slug, name, text, replyTo, adminReply } = body;

    const cleanName = stripTags(name || "");
    const cleanText = stripTags(text || "");

    if (cleanName.length < 2) {
      return new Response(JSON.stringify({ error: "Le prénom doit contenir au moins 2 caractères." }), { status: 400, headers });
    }
    if (cleanText.length < 10) {
      return new Response(JSON.stringify({ error: "Le commentaire doit contenir au moins 10 caractères." }), { status: 400, headers });
    }
    if (cleanText.length > 500) {
      return new Response(JSON.stringify({ error: "Le commentaire ne doit pas dépasser 500 caractères." }), { status: 400, headers });
    }
    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug requis." }), { status: 400, headers });
    }

    /* Vérification admin basique */
    let isAdmin = false;
    if (adminReply) {
      const authHeader = context.request.headers.get("Authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        isAdmin = true; /* L'utilisateur est authentifié */
      }
    }

    const kv = context.env.EIA_KV;
    const key = `comments:${slug}`;

    let data = { comments: [] };
    try {
      const raw = await kv.get(key);
      if (raw) data = JSON.parse(raw);
    } catch (_) {}

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
    await kv.put(key, JSON.stringify(data));

    /* Notification stockée dans KV */
    if (!isAdmin) {
      try {
        await kv.put(`notif:${Date.now()}`, JSON.stringify({
          type: "new_comment",
          slug,
          name: cleanName,
          text: cleanText,
          date: new Date().toISOString(),
          read: false,
        }));
      } catch (_) {}
    }

    return new Response(JSON.stringify(comment), { status: 201, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
