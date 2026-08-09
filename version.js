/* Renvoie l'identifiant du déploiement Cloudflare Pages en cours.
   Cloudflare injecte automatiquement CF_PAGES_COMMIT_SHA à chaque déploiement :
   sa valeur change dès qu'un nouveau commit est publié. Le site s'en sert pour
   détecter qu'une nouvelle version est en ligne et forcer un rechargement.

   Réponse : { "version": "<sha ou date>" }
   En-tête no-store pour que cette réponse ne soit jamais mise en cache. */
export function onRequest(context) {
  const env = context.env || {};
  // Identifiant de build fourni par Cloudflare ; repli sur la date si absent (dev local).
  const version = env.CF_PAGES_COMMIT_SHA
    || env.CF_PAGES_DEPLOYMENT_ID
    || String(Date.now());

  return new Response(JSON.stringify({ version: version }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
