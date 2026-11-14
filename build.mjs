// MIQAT Daily: static site generator, zero dependencies.
// Cara pakai: node build.mjs  ->  hasil di dist/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const POSTS_DIR = path.join(ROOT, 'content/posts');
const DIST = path.join(ROOT, 'dist');
const SITE = { name: 'MIQAT Daily', tagline: 'Melihat Saudi Lebih Dekat', ig: 'https://www.instagram.com/miqatdaily', tt: 'https://www.tiktok.com/@miqatdaily' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const shortDate = iso => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1].slice(0, 3)}`; };
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- markdown mini ----------
const inline = t => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
function md(src) {
  const lines = src.replace(/\r/g, '').split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^##\s+(.*)/))) { out.push(`<h2>${inline(m[1])}</h2>`); i++; continue; }
    if (l.startsWith('|')) {
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = r => r.split('|').slice(1, -1).map(c => c.trim());
      const head = cells(rows[0]); const body = rows.slice(2).map(cells);
      out.push(`<div class="tbl"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^- /.test(l)) { const it = []; while (i < lines.length && /^- /.test(lines[i])) { it.push(lines[i].slice(2)); i++; } out.push(`<ul>${it.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (/^\d+\.\s/.test(l)) { const it = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) { it.push(lines[i].replace(/^\d+\.\s/, '')); i++; } out.push(`<ol>${it.map(x => `<li>${inline(x)}</li>`).join('')}</ol>`); continue; }
    const p = []; while (i < lines.length && lines[i].trim() && !/^(##\s|\||- |\d+\.\s)/.test(lines[i])) { p.push(lines[i]); i++; }
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ---------- data ----------
const posts = fs.readdirSync(POSTS_DIR).filter(d => fs.existsSync(path.join(POSTS_DIR, d, 'post.json'))).map(d => {
  const dir = path.join(POSTS_DIR, d);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
  const body = fs.readFileSync(path.join(dir, 'article.md'), 'utf8');
  const words = body.split(/\s+/).length;
  return { ...meta, dir, body, mins: Math.max(1, Math.round(words / 190)), catSlug: slugify(meta.category) };
}).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
const cats = [...new Set(posts.map(p => p.category))].map(c => ({ name: c, slug: slugify(c), n: posts.filter(p => p.category === c).length }));

// ---------- layout ----------
const FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23043F2D'/%3E%3Ctext x='32' y='45' font-size='38' font-family='Georgia,serif' font-weight='700' text-anchor='middle' fill='%23DDB671'%3EQ%3C/text%3E%3C/svg%3E";
const NAV = [['/', 'Beranda'], ['/berita/', 'Berita'], ['/carousel/', 'Carousel'], ['/video/', 'Video'], ['/tentang/', 'Tentang']];
function layout({ title, desc, body, active = '/', og }) {
  const full = title === SITE.name ? title : `${title} | ${SITE.name}`;
  const ticker = posts.slice(0, 6).map(p => `<a href="/${p.slug}/">${esc(p.title)}</a>`).join('<span class="dot" aria-hidden="true">✦</span>');
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">${og ? `<meta property="og:image" content="${og}">` : ''}
<link rel="icon" href="${FAV}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css"></head>
<body>
<header class="top"><div class="wrap bar">
  <a href="/" class="brand" aria-label="MIQAT Daily, beranda"><img src="/assets/logo.png" alt="MIQAT. ${SITE.tagline}"></a>
  <nav aria-label="Menu utama">${NAV.map(([h, t]) => `<a href="${h}"${h === active ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
</div>
<div class="ticker"><div class="wrap"><b>TERKINI</b><div class="tk">${ticker}</div></div></div></header>
<main>${body}</main>
<footer class="site"><div class="wrap fgrid">
  <div><img src="/assets/logo.png" alt="MIQAT" class="flogo"><p class="fabout">MIQAT Daily menyajikan kabar haji, umrah, dan Saudi yang dipilah dan diperiksa sumbernya, dalam tiga format: berita, carousel, dan video.</p>
  <p class="soc"><a href="${SITE.ig}" rel="noopener">Instagram @miqatdaily</a><a href="${SITE.tt}" rel="noopener">TikTok @miqatdaily</a></p></div>
  <div><h4>Rubrik</h4><ul>${cats.map(c => `<li><a href="/topik/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></div>
  <div><h4>Jelajahi</h4><ul>${NAV.slice(1).map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
</div><div class="wrap copy">© 2026 MIQAT · ${SITE.tagline}.</div></footer>
</body></html>`;
}

const catTag = p => `<a class="tag" href="/topik/${p.catSlug}/">${esc(p.category)}</a>`;
const meta = p => `<span>${fmtDate(p.date)}</span><span>${p.mins} menit baca</span>`;
const row = p => `<article class="row"><a class="rimg" href="/${p.slug}/" tabindex="-1" aria-hidden="true"><img src="/${p.slug}/slide-1.jpg" alt="" loading="lazy"></a><div class="rbody"><div class="rowtop">${catTag(p)}</div><h3><a href="/${p.slug}/">${esc(p.title)}</a></h3><div class="meta">${meta(p)}${p.video ? '<span class="vid">Video</span>' : ''}</div></div></article>`;
const thumb = p => `<figure class="th"><a href="/${p.slug}/"><img src="/${p.slug}/slide-1.jpg" alt="Sampul carousel: ${esc(p.title)}" loading="lazy"></a><figcaption><span class="tag">${esc(p.category)}</span><a href="/${p.slug}/">${esc(p.title)}</a><small>${p.slides} slide · ${shortDate(p.date)}</small></figcaption></figure>`;
const secHead = (label, title, more) => `<div class="sh"><div><span class="lab">${label}</span><h2>${title}</h2></div>${more ? `<a class="more" href="${more}">Selengkapnya →</a>` : ''}</div>`;

// ---------- pages ----------
const pages = [];
const add = (p, html) => pages.push([p, html]);

const [lead, ...rest] = posts;
const vids = posts.filter(p => p.video);
add('index.html', layout({
  title: SITE.name, desc: 'Berita, carousel, dan video seputar haji, umrah, dan Saudi. MIQAT: Melihat Saudi Lebih Dekat.', og: lead && `/${lead.slug}/slide-1.jpg`,
  body: `<div class="herobg" style="--bg:url('/${lead.slug}/${fs.existsSync(path.join(lead.dir, 'hero.jpg')) ? 'hero.jpg' : 'slide-1.jpg'}')"><section class="wrap hero">
    <div class="lead"><div class="rowtop">${catTag(lead)}<span class="lab2">Berita utama</span></div>
      <h1><a href="/${lead.slug}/">${esc(lead.title)}</a></h1><p class="deck">${esc(lead.deck)}</p>
      <div class="meta">${meta(lead)}</div><a class="btn" href="/${lead.slug}/">Baca selengkapnya →</a>
      </div>
    <ul class="alsolist">${rest.slice(0, 4).map(p => `<li><a href="/${p.slug}/"><span class="tag s">${esc(p.category)}</span>${esc(p.title)}</a></li>`).join('')}</ul>
    <a class="cover" href="/${lead.slug}/"><img src="/${lead.slug}/slide-1.jpg" alt="Sampul: ${esc(lead.title)}"></a>
  </section></div>
  <section class="wrap sec">${secHead('Berita', 'Berita terbaru', '/berita/')}<div class="rows">${posts.slice(0, 8).map(row).join('')}</div></section>
  <section class="wrap sec">${secHead('Carousel', 'Carousel terbaru', '/carousel/')}<div class="thgrid">${posts.slice(0, 4).map(thumb).join('')}</div></section>
  ${vids.length ? `<section class="wrap sec">${secHead('Video', 'Video infografis', '/video/')}${videoBlock(vids[0])}</section>` : ''}
  <section class="wrap sec">${secHead('Rubrik', 'Jelajahi rubrik')}<div class="tiles">${cats.map(c => `<a class="tile" href="/topik/${c.slug}/"><b>${esc(c.name)}</b><span>${c.n} tulisan</span></a>`).join('')}</div></section>`
}));

function videoBlock(p) {
  return `<div class="vblock"><video controls preload="metadata" poster="/${p.slug}/poster.jpg" playsinline><source src="/${p.slug}/video.mp4" type="video/mp4"></video>
  <div><span class="tag">${esc(p.category)}</span><h3><a href="/${p.slug}/">${esc(p.title)}</a></h3><p class="deck">${esc(p.deck)}</p><div class="meta"><span>${fmtDate(p.date)}</span><span>9:16 · 30 detik</span></div><a class="btn ghost" href="/${p.slug}/">Baca beritanya →</a></div></div>`;
}

add('berita/index.html', layout({ title: 'Berita', desc: 'Semua berita MIQAT Daily.', active: '/berita/', body: `<section class="wrap sec">${secHead('Berita', 'Semua berita')}<div class="rows">${posts.map(row).join('')}</div></section>` }));
add('carousel/index.html', layout({ title: 'Carousel', desc: 'Carousel infografis MIQAT Daily.', active: '/carousel/', body: `<section class="wrap sec">${secHead('Carousel', 'Semua carousel')}<div class="thgrid">${posts.map(thumb).join('')}</div></section>` }));
add('video/index.html', layout({ title: 'Video', desc: 'Video infografis MIQAT Daily.', active: '/video/', body: `<section class="wrap sec">${secHead('Video', 'Semua video')}${vids.length ? vids.map(videoBlock).join('') : '<p>Belum ada video.</p>'}</section>` }));
for (const c of cats) add(`topik/${c.slug}/index.html`, layout({ title: c.name, desc: `Tulisan rubrik ${c.name} di MIQAT Daily.`, body: `<section class="wrap sec">${secHead('Rubrik', esc(c.name))}<div class="rows">${posts.filter(p => p.category === c.name).map(row).join('')}</div></section>` }));
add('tentang/index.html', layout({ title: 'Tentang', desc: 'Tentang MIQAT Daily.', active: '/tentang/', body: `<section class="wrap sec narrow"><span class="lab">Tentang</span><h1 class="h1s">MIQAT: ${SITE.tagline}</h1>
<div class="prose"><p>MIQAT Daily adalah media harian tentang haji, umrah, dan Saudi untuk pembaca Indonesia. Setiap hari kami memilih satu topik, memeriksa sumbernya, lalu menyajikannya dalam tiga format: berita lengkap, carousel infografis, dan video pendek.</p>
<h2>Cara kami bekerja</h2><ul><li>Memakai kabar 24 jam terakhir dari sumber primer atau minimal dua sumber kredibel.</li><li>Tidak memakai klaim viral yang belum terverifikasi.</li><li>Membedakan angka target dari realisasi, dan status berjalan dari rencana.</li><li>Mencantumkan sumber dan tanggal pembaruan di setiap tulisan.</li></ul>
<h2>Ikuti kami</h2><p><a href="${SITE.ig}" rel="noopener">Instagram @miqatdaily</a> · <a href="${SITE.tt}" rel="noopener">TikTok @miqatdaily</a></p></div></section>` }));
add('404.html', layout({ title: 'Halaman tidak ditemukan', desc: '404', body: `<section class="wrap sec narrow"><h1 class="h1s">Halaman tidak ditemukan</h1><p><a class="btn" href="/">Kembali ke beranda</a></p></section>` }));

for (const p of posts) {
  const showDeck = !p.body.includes(p.deck.slice(0, 50));
  const slides = Array.from({ length: p.slides }, (_, i) => `<figure><img src="/${p.slug}/slide-${i + 1}.jpg" alt="Slide ${i + 1} dari ${p.slides}: ${esc(p.title)}" loading="${i < 2 ? 'eager' : 'lazy'}"><figcaption>${String(i + 1).padStart(2, '0')} / ${String(p.slides).padStart(2, '0')}</figcaption></figure>`).join('');
  const vidItem = p.video ? `<figure class="vitem"><video controls preload="metadata" poster="/${p.slug}/poster.jpg" playsinline><source src="/${p.slug}/video.mp4" type="video/mp4"></video><figcaption>VIDEO · 30 DETIK</figcaption></figure>` : '';
  const srcs = (p.sources || []).length ? `<ul class="src">${p.sources.map(s => `<li>${s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</li>`).join('')}</ul>` : '';
  add(`${p.slug}/index.html`, layout({
    title: p.title, desc: p.deck.slice(0, 200), og: `/${p.slug}/slide-1.jpg`,
    body: `<article class="wrap post"><div class="rowtop">${catTag(p)}</div><h1>${esc(p.title)}</h1><div class="meta big">${meta(p)}</div>
    ${showDeck ? `<p class="sum">${esc(p.deck)}</p>` : ''}
    <section class="car" aria-label="Video dan carousel"><div class="carhead"><span class="lab">${p.video ? 'Video &amp; Carousel' : 'Carousel'}</span><span class="hint">Geser ke samping</span></div><div class="strip" tabindex="0">${vidItem}${slides}</div></section>
    <div class="prose more" id="more">${md(p.body)}</div>
    <button class="morebtn" id="morebtn" type="button" hidden aria-expanded="false" aria-controls="more">Selengkapnya</button>
    <script>(function(){var m=document.getElementById('more'),b=document.getElementById('morebtn');if(!m||!b)return;if(m.scrollHeight<=300)return;m.classList.add('clamp');b.hidden=false;b.addEventListener('click',function(){var o=m.classList.toggle('clamp');b.textContent=o?'Selengkapnya':'Tutup';b.setAttribute('aria-expanded',String(!o));});})();</script>
    <section class="srcbox"><h2>Sumber</h2>${srcs}${p.source_note ? `<p class="note">${esc(p.source_note)}</p>` : ''}<p class="note">Pembaruan ${fmtDate(p.date)}. MIQAT: ${SITE.tagline}.</p></section>
    <p><a class="back" href="/">← Kembali ke beranda</a></p></article>`
  }));
}

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
for (const [p, html] of pages) { const f = path.join(DIST, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'assets/style.css'), path.join(DIST, 'assets/style.css'));
fs.copyFileSync(path.join(ROOT, 'assets/logo.png'), path.join(DIST, 'assets/logo.png'));
for (const p of posts) for (const f of fs.readdirSync(p.dir)) if (/\.(jpg|png|mp4)$/.test(f)) { fs.mkdirSync(path.join(DIST, p.slug), { recursive: true }); fs.copyFileSync(path.join(p.dir, f), path.join(DIST, p.slug, f)); }
fs.writeFileSync(path.join(DIST, 'sitemap.txt'), posts.map(p => `/${p.slug}/`).join('\n') + '\n');
console.log(`OK: ${posts.length} tulisan, ${pages.length} halaman -> dist/`);
