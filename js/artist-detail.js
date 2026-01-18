import { getArtist } from "./artists.js";

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function linkRow(label, url){
  if(!url) return "";
  return `
    <a class="chip" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
      ${esc(label)}
    </a>
  `;
}

async function copyText(text){
  // Works best on https; on localhost it usually works too.
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    return false;
  }
}

function setCopyState(btn, msg){
  const prev = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = prev;
    btn.disabled = false;
  }, 1200);
}

export async function renderArtistDetail(sideKey){
  const root = document.querySelector("[data-artist-root]");
  if(!root) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  if(!slug){
    root.innerHTML = `<p class="muted">Geen artiest gekozen.</p>`;
    return;
  }

  const a = await getArtist(sideKey, slug);
  if(!a){
    root.innerHTML = `<p class="muted">Artiest niet gevonden.</p>`;
    return;
  }

  const links = a.links || {};
  const chips =
    linkRow("Instagram", links.instagram) +
    linkRow("SoundCloud", links.soundcloud) +
    linkRow("YouTube", links.youtube) +
    linkRow("Spotify", links.spotify) +
    linkRow("Official site", links.website);

  // UI
  root.innerHTML = `
    <div class="detailTop">
      <div>
        <h1 style="margin:0 0 10px;">${esc(a.name)}</h1>
        <div class="meta" style="margin:0 0 14px;">
          ${esc(a.role)}${a.city ? ` • ${esc(a.city)}` : ""}
        </div>
      </div>

      <div class="detailActions">
        <button class="chip chipBtn" type="button" data-copylink>Copy link</button>
      </div>
    </div>

    <p class="bio" style="max-width:70ch;">${esc(a.bio)}</p>

    <div style="height:18px;"></div>
    <div class="chips">${chips || `<span class="muted">links volgen</span>`}</div>

    <div class="copyFallback" data-copyfallback hidden>
      <div class="muted" style="margin-top:10px;">Kopiëren geblokkeerd — selecteer en kopieer handmatig:</div>
      <input class="copyInput" type="text" value="${esc(location.href)}" readonly />
    </div>
  `;

  // Copy link behavior
  const btn = root.querySelector("[data-copylink]");
  const fallback = root.querySelector("[data-copyfallback]");
  const input = root.querySelector(".copyInput");

  btn?.addEventListener("click", async () => {
    const ok = await copyText(location.href);
    if(ok){
      setCopyState(btn, "Copied ✓");
    }else{
      // fallback: show input + select
      fallback.hidden = false;
      input?.focus();
      input?.select();
      setCopyState(btn, "Select link");
    }
  });
}
