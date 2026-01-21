/* Kwartier West — artists.js (v6)
   Premium artist cards with images + deep links to artist detail page.
   Uses baseDepth so data loads correctly from any folder.
*/
console.log("🔥 NEW artists.js LOADED", import.meta.url);

function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
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

function isLeader(a){
  // founder highlight (pas slug aan als nodig)
  return (a?.slug || "").toLowerCase() === "onschuldig";
}

function card(a){
  const href = `./artist.html?slug=${encodeURIComponent(a.slug || "")}`;
  const photo = a.photo ? esc(a.photo) : "";
  const name = esc(a.name || "");
  const role = esc(a.role || "");
  const city = esc(a.city || "");
  const lang = esc(a.lang || "");

  const leader = isLeader(a);
  const roleLine = leader ? `Collective Lead` : role;

  const media = photo
    ? `<div class="artistMedia"><img class="artistImg" src="${photo}" alt="${name}" loading="lazy"></div>`
    : `<div class="artistMedia artistMediaEmpty" aria-hidden="true"></div>`;

  return `
    <article class="artistCard ${leader ? "isLeader" : ""}">
      <a class="artistHit" href="${href}" aria-label="Open ${name}"></a>

      ${leader ? `<div class="artistBadge">Collective Lead</div>` : ""}

      ${media}
      <div class="artistBody">
        <div class="artistRow">
          <h3 class="artistName">${name}</h3>
          <div class="artistMeta">${esc(roleLine || "")}</div>
        </div>
        <div class="artistSub">${city}${lang ? ` <span class="sep">•</span> ${lang}` : ""}</div>
        ${a.bio ? `<p class="artistBio">${esc(a.bio)}</p>` : ``}
      </div>
    </article>
  `;
}

export async function renderArtists(sideKey, opts={}){
  const mount = document.querySelector("[data-artists]");
  if(!mount) return;

  const baseDepth = Number(opts.baseDepth ?? 0);

  mount.innerHTML = `<div class="muted">Loading artists…</div>`;

  try{
    const data = await loadArtists(baseDepth);
    const list = pickSide(data, sideKey);

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
