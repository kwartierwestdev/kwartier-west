/* Kwartier West — artists.js (v6)
   Premium artist cards with images + deep links to artist detail page.
   Always loads from /data/artists.json (absolute path).
*/
console.log("🔥 artists.js LOADED", import.meta.url);

function esc(s=""){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

async function loadArtists(){
  const res = await fetch("/data/artists.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Cannot load /data/artists.json");
  return res.json();
}

function pickSide(data, sideKey){
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data[sideKey])) return data[sideKey];
  return [];
}

function card(a){
  const href = `./artist.html?slug=${encodeURIComponent(a.slug || "")}`;
  const photo = a.photo ? esc(a.photo) : "";
  const name = esc(a.name || "");
  const role = esc(a.role || "");
  const city = esc(a.city || "");
  const lang = esc(a.lang || "");

  const media = photo
    ? `<div class="artistMedia"><img class="artistImg" src="${photo}" alt="${name}" loading="lazy"></div>`
    : `<div class="artistMedia artistMediaEmpty" aria-hidden="true"></div>`;

  return `
    <article class="artistCard">
      <a class="artistHit" href="${href}" aria-label="Open ${name}"></a>
      ${media}
      <div class="artistBody">
        <div class="artistRow">
          <h3 class="artistName">${name}</h3>
          <div class="artistMeta">${role}</div>
        </div>
        <div class="artistSub">${city}${lang ? ` <span class="sep">•</span> ${lang}` : ""}</div>
        ${a.bio ? `<p class="artistBio">${esc(a.bio)}</p>` : ``}
      </div>
    </article>
  `;
}

export async function renderArtists(sideKey){
  const mount = document.querySelector("[data-artists]");
  if(!mount) return;

  mount.innerHTML = `<div class="muted">Loading artists…</div>`;

  try{
    const data = await loadArtists();
    const list = pickSide(data, sideKey);

    console.log("artists:", sideKey, "count:", list.length);

    if(!list.length){
      mount.innerHTML = `<div class="muted">No artists yet.</div>`;
      return;
    }

    mount.innerHTML = `<div class="artistGrid">${list.map(card).join("")}</div>`;
  }catch(err){
    console.error(err);
    mount.innerHTML = `<div class="muted">Could not load artists.</div>`;
  }
}
