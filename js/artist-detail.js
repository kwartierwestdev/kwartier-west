/* Kwartier West — artist-detail.js (v4)
   Reads ?slug= and renders an artist detail view.
   Uses baseDepth so data loads correctly from any folder.
*/

function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function getSlug(){
  const params = new URLSearchParams(window.location.search || "");
  return (params.get("slug") || "").trim();
}

function basePrefix(depth=0){
  return "../".repeat(Math.max(0, depth));
}

async function loadArtists(baseDepth){
  const url = `${basePrefix(baseDepth)}data/artists.json`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Cannot load ${url}`);
  return res.json();
}

function pickSide(data, sideKey){
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data[sideKey])) return data[sideKey];
  return [];
}

function renderLinks(links){
  if(!Array.isArray(links) || !links.length) return "";
  const items = links
    .filter(l => l && l.url)
    .map(l => {
      const label = esc(l.label || "Link");
      const url = esc(l.url);
      return `<a class="chip" href="${url}" target="_blank" rel="noopener">${label}</a>`;
    })
    .join("");
  return `<div class="chips" style="margin-top:12px;">${items}</div>`;
}

export async function renderArtistDetail(sideKey, opts={}){
  const root = document.querySelector("[data-artist-root]");
  if(!root) return;

  const baseDepth = Number(opts.baseDepth ?? 0);
  const slug = getSlug();

  if(!slug){
    root.innerHTML = `<div class="muted">No artist selected.</div>`;
    return;
  }

  root.innerHTML = `<div class="muted">Loading…</div>`;

  try{
    const data = await loadArtists(baseDepth);
    const list = pickSide(data, sideKey);
    const a = list.find(x => x.slug === slug);

    if(!a){
      root.innerHTML = `<div class="muted">Artist not found.</div>`;
      return;
    }

    const name = esc(a.name || "");
    const role = esc(a.role || "");
    const city = esc(a.city || "");
    const lang = esc(a.lang || "");
    const bio = a.bio ? esc(a.bio) : "";
    const photo = a.photo ? esc(a.photo) : "";

    const media = photo
      ? `<div class="artistHeroMedia"><img class="artistHeroImg" src="${photo}" alt="${name}" loading="eager"></div>`
      : "";

    root.innerHTML = `
      <section class="artistHero">
        ${media}
        <div class="artistHeroBody">
          <div class="kicker"><span class="dot"></span> ${role || "Artist"} <span class="sep">•</span> ${city}${lang ? ` <span class="sep">•</span> ${lang}` : ""}</div>
          <h1 class="artistHeroTitle">${name}</h1>
          ${bio ? `<p class="artistHeroBio">${bio}</p>` : ``}
          ${renderLinks(a.links)}
        </div>
      </section>
    `;
  }catch(err){
    console.error(err);
    root.innerHTML = `<div class="muted">Could not load artist.</div>`;
  }
}
