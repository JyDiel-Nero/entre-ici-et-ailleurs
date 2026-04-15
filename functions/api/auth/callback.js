export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return new Response(
        `<html><body><h2>Erreur GitHub OAuth</h2><p>${tokenData.error_description || tokenData.error}</p><p><a href="/admin">Retour au CMS</a></p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const token = tokenData.access_token;
    const provider = "github";

    // Decap CMS expects this exact postMessage format
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authentification...</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;color:#666">Connexion en cours...</p>
<script>
(function() {
  function receiveMessage(e) {
    console.log("receiveMessage", e);
    window.opener.postMessage(
      'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
      e.origin
    );
    window.close();
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:${provider}", "*");
})();
</script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (err) {
    return new Response(
      `<html><body><h2>Erreur serveur</h2><p>${err.message}</p><p><a href="/admin">Retour au CMS</a></p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
