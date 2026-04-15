const ALLOWED_ORIGIN = "https://entre-ici-et-ailleurs.pages.dev";

export async function onRequest(context) {
  const { env } = context;
  
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${ALLOWED_ORIGIN}/api/auth/callback`,
    scope: "repo,user",
    state: crypto.randomUUID(),
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302
  );
}
