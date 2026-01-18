async function loadArtists(){
  const res = await fetch("../../data/artists.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Kan data/artists.json niet laden.");
  return res.json();
}

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function linkItem(label, url){
  if(!url) return "";
  const safe = esc(url);
  return `<a class="chip" href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function detailHref(slug){
  return `./artist.html?slug=${encodeURIComponent(slug)}`;
}

function card(a){
  const links = a.links || {};
  const chips =
    linkItem("IG", links.instagram) +
    linkItem("SC", links.soundcloud) +
    linkItem("YT", links.youtube) +
    linkItem("SP", links.spotify) +
    linkItem("Site", links.website);

  return `
    <article class="card cardLink">
      <a class="cardA" href="${detailHref(a.slug)}" aria-label="Open ${esc(a.name)}"></a>

      <div class="cardTop">
        <h3>${esc(a.name)}</h3>
        <div class="meta">${esc(a.role)}${a.city ? ` • ${esc(a.city)}` : ""}</div>
      </div>

      <p class="bio">${esc(a.bio)}</p>

      <div class="chips">
        ${chips || `<span class="muted">links volgen</span>`}
      </div>
    </article>
  `;
}

export async function renderArtists(sideKey){
  const data = await loadArtists();
  const list = data?.[sideKey] || [];
  const el = document.querySelector("[data-artists]");
  if(!el) return;

  el.innerHTML = list.length
    ? `<div class="grid">${list.map(card).join("")}</div>`
    : `<p class="muted">Nog geen artiesten toegevoegd.</p>`;
}

export async function getArtist(sideKey, slug){
  const data = await loadArtists();
  const list = data?.[sideKey] || [];
  return list.find(a => a.slug === slug) || null;
}
