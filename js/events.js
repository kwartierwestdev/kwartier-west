function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

async function loadEvents(){
  const res = await fetch("../../data/events.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Kan data/events.json niet laden.");
  return res.json();
}

function niceDate(iso){
  return iso || "";
}

function lineupList(sideKey, lineup){
  const arr = Array.isArray(lineup) ? lineup : [];
  if(!arr.length) return `<span class="muted">Line-up: later</span>`;

  const items = arr.map(a => {
    if(a?.slug){
      // link to artist detail template in same side
      return `<a class="inlineLink" href="./artist.html?slug=${encodeURIComponent(a.slug)}">${esc(a.name || a.slug)}</a>`;
    }
    return `<span>${esc(a?.name || "")}</span>`;
  });

  return `<span class="muted">Line-up:</span> ${items.join('<span class="sep">•</span>')}`;
}

function ticketCta(tickets){
  const mode = tickets?.mode || "tba";
  const url = tickets?.url || "";

  if(mode === "external" && url){
    return `<a class="chip" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Tickets</a>`;
  }
  if(mode === "internal"){
    return `<a class="chip" href="../tickets/index.html">Tickets</a>`;
  }
  return `<span class="muted">Tickets: later</span>`;
}

function bookingCta(){
  // per side page: booking.html in same folder
  return `<a class="chip" href="./booking.html">Boek artiest</a>`;
}

function item(sideKey, e){
  const meta = [
    niceDate(e.date),
    e.time ? esc(e.time) : "",
    e.city ? esc(e.city) : "",
    e.venue ? esc(e.venue) : ""
  ].filter(Boolean).join(" • ");

  return `
    <div class="event">
      <div class="eventMain">
        <div class="eventTitle">${esc(e.title)}</div>
        <div class="eventMeta">${esc(meta)}</div>
        <div class="eventLineup">${lineupList(sideKey, e.lineup)}</div>
        ${e.notes ? `<div class="eventNotes muted">${esc(e.notes)}</div>` : ""}
      </div>

      <div class="eventSide">
        ${e.status ? `<div class="eventStatus">${esc(e.status)}</div>` : ""}
        <div class="eventCtas">
          ${ticketCta(e.tickets)}
          ${bookingCta()}
        </div>
      </div>
    </div>
  `;
}

export async function renderEvents(sideKey){
  const data = await loadEvents();
  const list = data?.[sideKey] || [];
  const el = document.querySelector("[data-events]");
  if(!el) return;

  el.innerHTML = list.length
    ? `<div class="events">${list.map(e => item(sideKey, e)).join("")}</div>`
    : `<p class="muted">Nog geen events toegevoegd.</p>`;
}
