/* Cloudflare Pages Middleware
   1. SPA routing: serve index.html for all non-file routes
   2. Dynamic OG tags for article pages (social crawlers)
   3. 301 redirects for old routes
*/
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  /* Skip API routes and admin */
  if (path.startsWith('/api/') || path.startsWith('/admin')) {
    return context.next();
  }

  /* 301 redirects: old routes → new routes */
  const redirects = {
    '/blog': '/heures',
    '/univers': '/secondes',
    '/apropos': '/un-instant',
    '/contact': '/entretemps',
    '/audio': '/minutes',
    '/oeuvres': '/saisons'
  };
  const cleanPath = path.replace(/\/+$/, '');
  if (redirects[cleanPath]) {
    return Response.redirect(new URL(redirects[cleanPath], url.origin).toString(), 301);
  }

  /* SPA routes that should serve index.html */
  const spaRoutes = [
    '/heures', '/minutes', '/secondes', '/saisons',
    '/un-instant', '/entretemps', '/confidentialite'
  ];
  const isSpaRoute = spaRoutes.includes(cleanPath) ||
    path.startsWith('/article/') ||
    path.startsWith('/custom-');

  if (!isSpaRoute) {
    /* Not a SPA route — let Cloudflare serve static files normally */
    return context.next();
  }

  /* Fetch index.html from origin */
  const indexUrl = new URL('/index.html', url.origin);
  const indexRes = await fetch(indexUrl);
  let html = await indexRes.text();

  /* Dynamic OG tags for article pages + social crawlers */
  const ua = (context.request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot/i.test(ua);

  if (isCrawler && path.startsWith('/article/')) {
    const slug = path.replace('/article/', '');
    try {
      const postsUrl = new URL('/data/posts.json', url.origin);
      const postsRes = await fetch(postsUrl);
      const postsData = await postsRes.json();
      const post = (postsData.posts || []).find(p => p.slug === slug);

      if (post) {
        const title = (post.title || 'JyDiel In-Time').replace(/"/g, '&quot;');
        const desc = (post.excerpt || 'Poésie, prière et méditation par J.Y.D.').replace(/"/g, '&quot;').substring(0, 200);
        const image = post.cover || post.thumb || '/images/clock.jpg';
        const imageUrl = image.startsWith('http') ? image : 'https://jydielintime.com' + (image.startsWith('/') ? image : '/' + image);
        const articleUrl = 'https://jydielintime.com/article/' + slug;

        html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title} — JyDiel In-Time">`);
        html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}">`);
        html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${articleUrl}">`);
        html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${imageUrl}">`);
        html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title} — JyDiel In-Time">`);
        html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${desc}">`);
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} — JyDiel In-Time</title>`);
        html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${articleUrl}">`);
      }
    } catch (e) { /* ignore */ }
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
