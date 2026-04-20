/* Cloudflare Pages Middleware — Dynamic OG tags for article pages */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const ua = (context.request.headers.get('user-agent') || '').toLowerCase();
  
  /* Only modify for social media crawlers on article pages */
  const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot/i.test(ua);
  
  if (!isCrawler || !url.pathname.startsWith('/article/')) {
    return context.next();
  }
  
  const slug = url.pathname.replace('/article/', '');
  
  try {
    /* Fetch posts data */
    const postsUrl = new URL('/data/posts.json', url.origin);
    const postsRes = await fetch(postsUrl);
    const postsData = await postsRes.json();
    const post = (postsData.posts || []).find(p => p.slug === slug);
    
    if (!post) return context.next();
    
    /* Get the original HTML */
    const response = await context.next();
    let html = await response.text();
    
    /* Replace OG tags */
    const title = (post.title || 'Entre ici et ailleurs').replace(/"/g, '&quot;');
    const desc = (post.excerpt || '').replace(/"/g, '&quot;').substring(0, 200);
    const image = post.cover || post.thumb || '';
    const articleUrl = url.href;
    
    html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title} — Entre ici et ailleurs">`);
    html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}">`);
    html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${articleUrl}">`);
    if (image) {
      html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}">`);
    }
    html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}">`);
    html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${desc}">`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} — Entre ici et ailleurs</title>`);
    
    return new Response(html, {
      headers: { ...Object.fromEntries(response.headers), 'content-type': 'text/html; charset=utf-8' }
    });
  } catch (e) {
    return context.next();
  }
}
