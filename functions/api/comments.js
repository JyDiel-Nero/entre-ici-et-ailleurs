/* ════════════════════════════════════════════════════════════════
   GET-COMMENTS — Cloudflare Pages Function
   GET /api/comments?slug=chemin
   Stockage : Cloudflare KV (namespace EIA_KV)
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
    const raw = await kv.get(`comments:${slug}`);
    const data = raw ? JSON.parse(raw) : { comments: [] };
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ comments: [] }), { status: 200, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}
