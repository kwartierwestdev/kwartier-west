/* Kwartier West — partners.js
   Loads /data/partners.json and renders partner cards in the unified design system.
*/

function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

async function loadPartners(){
  // Absolute path = stable from any page depth
  const res = await fetch("/data/partners.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Cannot load /data/partners.json");
  return res.json();
}

function linkChip(l){
  const label = esc(l?.label || "Link");
  const url = String(l?.url || "").trim();
  if(!url) return "";

  const isExternal = /^https?:\/\//i.test(url);
  const attrs = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="chip" href="${esc(url)}"${attrs}>${label}</a>`;
}

function card(p){
  const name = esc(p?.name || "");
  const type = esc(p?.type || "");
  const region = esc(p?.region || "");
  const bio = esc(p?.bio || "");
  const tags = Array.isArray(p?.tags) ? p.tags : [];
  const links = Array.isArray(p?.links) ? p.links : [];

  return `
    <article class="card" style="grid-column: span 6;">
      <div class="cardTop">
        <h3>${name}</h3>
        <div class="meta">${type}</div>
      </div>

      <p class="bio" style="margin-bottom:12px;">${bio}</p>

      <div class="muted" style="font-size:12px; margin-bottom:10px;">
        ${region ? esc(region) : ""}
        ${tags.length ? ` <span class="sep">•</span> ${tags.map(esc).join('<span class="sep">•</span>')}` : ""}
      </div>

      <div class="chips">
        ${links.length ? links.map(linkChip).join("") : `<span class="muted">Links: TBA</span>`}
      </div>
    </article>
  `;
}

export async function renderPartners(){
  const mount = document.querySelector("[data-partners]");
  if(!mount) return;

  mount.innerHTML = `<div class="muted">Loading partners…</div>`;

  try{
    const data = await loadPartners();
    const list = Array.isArray(data?.partners) ? data.partners : [];

    if(!list.length){
      mount.innerHTML = `<div class="muted">No partners yet.</div>`;
      return;
    }

    mount.innerHTML = `<div class="grid">${list.map(card).join("")}</div>`;
  }catch(err){
    console.error(err);
    mount.innerHTML = `<div class="muted">Could not load partners.</div>`;
  }
}
