/* ════════════════════════════════════════════════════════════════
   LIKE-POST — Cloudflare Pages Function
   POST /api/like-post { slug, action: 'like'|'unlike' }
   Anti-spam : 1 like par IP par article
   Stockage : Cloudflare KV
   ════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = await context.request.json();
    const { slug, action } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug requis" }), { status: 400, headers });
    }

    /* IP pour anti-spam */
    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

    const kv = context.env.EIA_KV;
    const key = `likes:${slug}`;

    let data = { count: 0, ips: [] };
    try {
      const raw = await kv.get(key);
      if (raw) data = JSON.parse(raw);
    } catch (_) {}

    const alreadyLiked = data.ips.indexOf(ip) !== -1;

    if (action === "like" && !alreadyLiked) {
      data.count = (data.count || 0) + 1;
      data.ips.push(ip);
    } else if (action === "unlike" && alreadyLiked) {
      data.count = Math.max(0, (data.count || 0) - 1);
      data.ips = data.ips.filter(function(x) { return x !== ip; });
    }

    await kv.put(key, JSON.stringify(data));

    return new Response(JSON.stringify({ slug, count: data.count }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
