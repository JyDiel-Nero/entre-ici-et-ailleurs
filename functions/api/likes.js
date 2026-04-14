/* ════════════════════════════════════════════════════════════════
   GET-LIKES — Cloudflare Pages Function
   GET /api/likes?slug=chemin
   Stockage : Cloudflare KV
   ════════════════════════════════════════════════════════════════ */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug requis" }), { status: 400, headers });
  }

  try {
    const kv = context.env.EIA_KV;
    const raw = await kv.get(`likes:${slug}`);
    const data = raw ? JSON.parse(raw) : { count: 0, ips: [] };
    return new Response(JSON.stringify({ slug, count: data.count || 0 }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ slug, count: 0 }), { status: 200, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}
