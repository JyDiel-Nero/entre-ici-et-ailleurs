export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  if(path.startsWith('/api/')||path.startsWith('/admin')) return context.next();

  if(path==='/sitemap.xml'){
    try{
      const d=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const posts=(d.posts||[]).filter(p=>p.published!==false);
      const b='https://jydielintime.com',now=new Date().toISOString().split('T')[0];
      let x='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      x+=`<url><loc>${b}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>\n`;
      [['heures','daily','0.9'],['minutes','weekly','0.7'],['secondes','weekly','0.7'],['saisons','monthly','0.6'],['un-instant','monthly','0.5'],['entretemps','monthly','0.5']].forEach(([s,cf,p])=>{
        x+=`<url><loc>${b}/${s}</loc><changefreq>${cf}</changefreq><priority>${p}</priority></url>\n`;
      });
      posts.forEach(p=>{
        const d2=p.publishDate?new Date(p.publishDate).toISOString().split('T')[0]:now;
        x+=`<url><loc>${b}/article/${p.slug}</loc><lastmod>${d2}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
      });
      x+='</urlset>';
      return new Response(x,{headers:{'content-type':'application/xml;charset=utf-8','cache-control':'public,max-age=3600'}});
    }catch(e){return context.next();}
  }

  if(path==='/feed.xml'){
    try{
      const d=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const posts=(d.posts||[]).filter(p=>p.published!==false).slice(0,20);
      const b='https://jydielintime.com';
      const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      let r='<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n';
      r+=`<title>JyDiel In-Time</title>\n<link>${b}</link>\n<description>Poésie, prière et méditation par J.Y.D.</description>\n<language>fr</language>\n`;
      r+=`<atom:link href="${b}/feed.xml" rel="self" type="application/rss+xml"/>\n`;
      r+=`<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
      posts.forEach(p=>{
        const dt=p.publishDate?new Date(p.publishDate).toUTCString():new Date().toUTCString();
        r+=`<item>\n<title>${esc(p.title)}</title>\n<link>${b}/article/${p.slug}</link>\n`;
        r+=`<guid isPermaLink="true">${b}/article/${p.slug}</guid>\n`;
        r+=`<description>${esc(p.excerpt||(p.body||'').substring(0,200))}</description>\n<pubDate>${dt}</pubDate>\n`;
        if(p.tag) r+=`<category>${esc(p.tag)}</category>\n`;
        r+='</item>\n';
      });
      r+='</channel>\n</rss>';
      return new Response(r,{headers:{'content-type':'application/rss+xml;charset=utf-8','cache-control':'public,max-age=3600'}});
    }catch(e){return context.next();}
  }

  if(path.match(/\.\w{2,5}$/)&&!path.startsWith('/article/')) return context.next();

  const redir={'/blog':'/heures','/univers':'/secondes','/apropos':'/un-instant','/contact':'/entretemps','/audio':'/minutes','/oeuvres':'/saisons'};
  const clean=path.replace(/\/+$/,'');
  if(redir[clean]) return Response.redirect(new URL(redir[clean],url.origin).toString(),301);

  const spa=['/heures','/minutes','/secondes','/saisons','/un-instant','/entretemps','/confidentialite'];
  const isSpa=spa.includes(clean)||path.startsWith('/article/')||path.startsWith('/custom-');
  if(!isSpa) return context.next();

  const res=await fetch(new URL('/index.html',url.origin));
  let html=await res.text();

  const ua=(context.request.headers.get('user-agent')||'').toLowerCase();
  const isCrawler=/facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot/i.test(ua);
  if(isCrawler&&path.startsWith('/article/')){
    const slug=path.replace('/article/','');
    try{
      const pd=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const p=(pd.posts||[]).find(x=>x.slug===slug);
      if(p){
        const t=(p.title||'JyDiel In-Time').replace(/"/g,'&quot;');
        const desc=(p.excerpt||'Poésie, prière et méditation').replace(/"/g,'&quot;').substring(0,200);
        const img=p.cover||p.thumb||'/images/clock.jpg';
        const imgUrl=img.startsWith('http')?img:'https://jydielintime.com'+(img.startsWith('/')?img:'/'+img);
        const aUrl='https://jydielintime.com/article/'+slug;
        html=html.replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${t} — JyDiel In-Time">`);
        html=html.replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${desc}">`);
        html=html.replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${aUrl}">`);
        html=html.replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${imgUrl}">`);
        html=html.replace(/<title>[^<]*<\/title>/,`<title>${t} — JyDiel In-Time</title>`);
        html=html.replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${aUrl}">`);
      }
    }catch(e){}
  }
  return new Response(html,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'public,max-age=300'}});
}export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  if(path.startsWith('/api/')||path.startsWith('/admin')) return context.next();

  if(path==='/sitemap.xml'){
    try{
      const d=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const posts=(d.posts||[]).filter(p=>p.published!==false);
      const b='https://jydielintime.com',now=new Date().toISOString().split('T')[0];
      let x='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      x+=`<url><loc>${b}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>\n`;
      [['heures','daily','0.9'],['minutes','weekly','0.7'],['secondes','weekly','0.7'],['saisons','monthly','0.6'],['un-instant','monthly','0.5'],['entretemps','monthly','0.5']].forEach(([s,cf,p])=>{
        x+=`<url><loc>${b}/${s}</loc><changefreq>${cf}</changefreq><priority>${p}</priority></url>\n`;
      });
      posts.forEach(p=>{
        const d2=p.publishDate?new Date(p.publishDate).toISOString().split('T')[0]:now;
        x+=`<url><loc>${b}/article/${p.slug}</loc><lastmod>${d2}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
      });
      x+='</urlset>';
      return new Response(x,{headers:{'content-type':'application/xml;charset=utf-8','cache-control':'public,max-age=3600'}});
    }catch(e){return context.next();}
  }

  if(path==='/feed.xml'){
    try{
      const d=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const posts=(d.posts||[]).filter(p=>p.published!==false).slice(0,20);
      const b='https://jydielintime.com';
      const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      let r='<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n';
      r+=`<title>JyDiel In-Time</title>\n<link>${b}</link>\n<description>Poésie, prière et méditation par J.Y.D.</description>\n<language>fr</language>\n`;
      r+=`<atom:link href="${b}/feed.xml" rel="self" type="application/rss+xml"/>\n`;
      r+=`<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
      posts.forEach(p=>{
        const dt=p.publishDate?new Date(p.publishDate).toUTCString():new Date().toUTCString();
        r+=`<item>\n<title>${esc(p.title)}</title>\n<link>${b}/article/${p.slug}</link>\n`;
        r+=`<guid isPermaLink="true">${b}/article/${p.slug}</guid>\n`;
        r+=`<description>${esc(p.excerpt||(p.body||'').substring(0,200))}</description>\n<pubDate>${dt}</pubDate>\n`;
        if(p.tag) r+=`<category>${esc(p.tag)}</category>\n`;
        r+='</item>\n';
      });
      r+='</channel>\n</rss>';
      return new Response(r,{headers:{'content-type':'application/rss+xml;charset=utf-8','cache-control':'public,max-age=3600'}});
    }catch(e){return context.next();}
  }

  if(path.match(/\.\w{2,5}$/)&&!path.startsWith('/article/')) return context.next();

  const redir={'/blog':'/heures','/univers':'/secondes','/apropos':'/un-instant','/contact':'/entretemps','/audio':'/minutes','/oeuvres':'/saisons'};
  const clean=path.replace(/\/+$/,'');
  if(redir[clean]) return Response.redirect(new URL(redir[clean],url.origin).toString(),301);

  const spa=['/heures','/minutes','/secondes','/saisons','/un-instant','/entretemps','/confidentialite'];
  const isSpa=spa.includes(clean)||path.startsWith('/article/')||path.startsWith('/custom-');
  if(!isSpa) return context.next();

  const res=await fetch(new URL('/index.html',url.origin));
  let html=await res.text();

  const ua=(context.request.headers.get('user-agent')||'').toLowerCase();
  const isCrawler=/facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot/i.test(ua);
  if(isCrawler&&path.startsWith('/article/')){
    const slug=path.replace('/article/','');
    try{
      const pd=await fetch(new URL('/data/posts.json',url.origin)).then(r=>r.json());
      const p=(pd.posts||[]).find(x=>x.slug===slug);
      if(p){
        const t=(p.title||'JyDiel In-Time').replace(/"/g,'&quot;');
        const desc=(p.excerpt||'Poésie, prière et méditation').replace(/"/g,'&quot;').substring(0,200);
        const img=p.cover||p.thumb||'/images/clock.jpg';
        const imgUrl=img.startsWith('http')?img:'https://jydielintime.com'+(img.startsWith('/')?img:'/'+img);
        const aUrl='https://jydielintime.com/article/'+slug;
        html=html.replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${t} — JyDiel In-Time">`);
        html=html.replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${desc}">`);
        html=html.replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${aUrl}">`);
        html=html.replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${imgUrl}">`);
        html=html.replace(/<title>[^<]*<\/title>/,`<title>${t} — JyDiel In-Time</title>`);
        html=html.replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${aUrl}">`);
      }
    }catch(e){}
  }
  return new Response(html,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'public,max-age=300'}});
}
