/**
 * GitHub OAuth handler for Decap CMS — Cloudflare Pages Function
 * Route: /api/auth
 *
 * Setup (one-time):
 * 1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
 *    - Homepage URL: https://jydielintime.com
 *    - Callback URL: https://jydielintime.com/api/auth
 * 2. Cloudflare Pages → entre-ici-et-ailleurs → Settings → Environment variables
 *    - OAUTH_CLIENT_ID = (your GitHub OAuth App client ID)
 *    - OAUTH_CLIENT_SECRET = (your GitHub OAuth App client secret)
 */

const SITE_ORIGIN = 'https://jydielintime.com';
const GITHUB_AUTH  = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const params = url.searchParams;

  const CLIENT_ID     = env.OAUTH_CLIENT_ID;
  const CLIENT_SECRET = env.OAUTH_CLIENT_SECRET;

  /* ── Step 1: Redirect to GitHub ── */
  if (!params.get('code')) {
    if (!CLIENT_ID) return errorPage('OAUTH_CLIENT_ID not set in Cloudflare env vars');

    const state = crypto.randomUUID();
    const redirect = new URL(GITHUB_AUTH);
    redirect.searchParams.set('client_id', CLIENT_ID);
    redirect.searchParams.set('scope', 'repo,user');
    redirect.searchParams.set('state', state);
    redirect.searchParams.set('redirect_uri', `${SITE_ORIGIN}/api/auth`);

    return Response.redirect(redirect.toString(), 302);
  }

  /* ── Step 2: Exchange code for token ── */
  const code  = params.get('code');
  const state = params.get('state') || '';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return errorPage('OAuth env vars not set. Add OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET in Cloudflare Pages settings.');
  }

  let token = '';
  try {
    const res = await fetch(GITHUB_TOKEN, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${SITE_ORIGIN}/api/auth`,
        state,
      }),
    });

    const data = await res.json();
    token = data.access_token;

    if (!token) {
      return errorPage(`GitHub returned no token: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    return errorPage(`Token exchange failed: ${e.message}`);
  }

  /* ── Step 3: Return token to Decap CMS via postMessage ── */
  const html = `<!DOCTYPE html>
<html>
<head><title>Authentification…</title></head>
<body>
<p style="font-family:sans-serif;color:#888;text-align:center;margin-top:40px">
  Connexion en cours…
</p>
<script>
(function(){
  var token = ${JSON.stringify(token)};
  var msg   = JSON.stringify({
    token: token,
    provider: 'github'
  });
  /* Decap CMS listens for this message */
  function send(){
    if(window.opener){
      window.opener.postMessage('authorization:github:success:' + msg, '*');
      setTimeout(function(){ window.close(); }, 500);
    } else {
      document.body.innerHTML = '<p style="font-family:sans-serif;color:#888;text-align:center;margin-top:40px">Connecté. Vous pouvez fermer cette fenêtre.</p>';
    }
  }
  send();
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function errorPage(msg) {
  return new Response(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#c00;padding:40px">
<h2>Erreur OAuth</h2>
<p>${msg}</p>
<p><a href="/admin">Retour au CMS</a></p>
</body>
</html>`, {
    status: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
