const GITHUB_CLIENT_ID = () => globalThis.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = () => globalThis.GITHUB_CLIENT_SECRET;

const ALLOWED_ORIGIN = "https://entre-ici-et-ailleurs.pages.dev";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace("/functions/api/auth", "") || "/";

  // Auth init — redirect to GitHub
  if (path === "/" || path === "") {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: `${ALLOWED_ORIGIN}/functions/api/auth/callback`,
      scope: "repo,user",
      state: crypto.randomUUID(),
    });
    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params}`,
      302
    );
  }

  // OAuth callback
  if (path === "/callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return new Response(`GitHub OAuth error: ${tokenData.error_description}`, {
        status: 400,
      });
    }

    const token = tokenData.access_token;
    const provider = "github";

    // Decap CMS expects this specific postMessage format
    const script = `
<!DOCTYPE html>
<html>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e);
      window.opener.postMessage(
        'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
        e.origin
      );
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:${provider}", "*");
  })()
<\/script>
</body>
</html>`;

    return new Response(script, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response("Not found", { status: 404 });
}
