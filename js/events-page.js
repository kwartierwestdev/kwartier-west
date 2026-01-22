// js/events-page.js
// Global Events hub: loads /data/events.json (stable on Vercel) and renders a premium list + featured.
// Later swap loadEvents() to your API endpoint without touching the page HTML.

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}
function basePrefix(depth=0){
  return "../".repeat(Math.max(0, depth));
}

async function loadEvents(baseDepth=0){
  const url = `${basePrefix(baseDepth)}data/events.json`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Cannot load ${url}`);
  return res.json();
}


function parseDateISO(d){
  // YYYY-MM-DD
  if(!d) return null;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : null;
}

function bySoonest(a,b){
  const da = parseDateISO(a.date) ?? Infinity;
  const db = parseDateISO(b.date) ?? Infinity;
  return da - db;
}

function flatten(data){
  const hiphop = Array.isArray(data?.hiphop) ? data.hiphop.map(e => ({...e, sideKey:"hiphop"})) : [];
  const tekno  = Array.isArray(data?.tekno)  ? data.tekno.map(e => ({...e, sideKey:"tekno"})) : [];
  return [...hiphop, ...tekno].sort(bySoonest);
}

function sideLabel(sideKey){
  return sideKey === "tekno" ? "TEK" : "HIP HOP";
}

function metaLine(e){
  const bits = [
    e.date || "",
    e.time || "",
    e.region || e.city || "",
    e.venue || ""
  ].filter(Boolean);
  return bits.join(" • ");
}

function lineupHTML(e){
  const arr = Array.isArray(e.lineup) ? e.lineup : [];
  if(!arr.length) return `<span class="muted">Line-up: TBA</span>`;

  // From /pages/events/ -> artist pages are siblings: ../tekno/artist.html / ../hiphop/artist.html
  const items = arr.map(a => {
    const slug = a?.slug;
    const name = esc(a?.name || a?.slug || "");
    if(slug){
      const href = `../${e.sideKey}/artist.html?slug=${encodeURIComponent(slug)}`;
      return `<a class="inlineLink" href="${href}">${name}</a>`;
    }
    return `<span>${name}</span>`;
  });

  return `<span class="muted">Line-up:</span> ${items.join('<span class="sep">•</span>')}`;
}

function ticketsCTA(e){
  const mode = e?.tickets?.mode || "tba";
  const url  = e?.tickets?.url || "";

  if(mode === "external" && url){
    return `<a class="ctaBtn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Tickets</a>`;
  }
  if(mode === "internal"){
    return `<a class="ctaBtn" href="../tickets/index.html">Tickets</a>`;
  }
  return `<span class="muted">Tickets: TBA</span>`;
}

function bookingCTA(e){
  return `<a class="ctaBtn" href="../${e.sideKey}/booking.html">Book an act</a>`;
}

function featureCard(e){
  return `
    <div class="featureCard">
      <div class="featureKicker">
        <div class="badgeSide">${sideLabel(e.sideKey)}</div>
        ${e.status ? `<div class="eventStatus">${esc(e.status)}</div>` : ``}
      </div>

      <div class="featureTitle">${esc(e.title || "Untitled")}</div>
      <div class="featureMeta">${esc(metaLine(e) || "Details TBA")}</div>

      <div class="featureLineup">${lineupHTML(e)}</div>
      ${e.notes ? `<div class="eventNotes muted" style="margin-top:10px;">${esc(e.notes)}</div>` : ""}

      <div class="featureCtas">
        ${ticketsCTA(e)}
        ${bookingCTA(e)}
        <a class="ctaBtn" href="../${e.sideKey}/index.html#events">Open ${sideLabel(e.sideKey)} page</a>
      </div>
    </div>
  `;
}

function listItem(e){
  // reuse your base.css event styles so everything stays unified
  const meta = esc(metaLine(e));
  const side = sideLabel(e.sideKey);

  const sideChip = `<span class="eventStatus">${side}</span>`;

  const ticket = (e?.tickets?.mode === "external" && e?.tickets?.url)
    ? `<a class="chip" href="${esc(e.tickets.url)}" target="_blank" rel="noopener noreferrer">Tickets</a>`
    : (e?.tickets?.mode === "internal")
      ? `<a class="chip" href="../tickets/index.html">Tickets</a>`
      : `<span class="muted">Tickets: TBA</span>`;

  return `
    <div class="event" data-side="${esc(e.sideKey)}">
      <div class="eventMain">
        <div class="eventTitle">${esc(e.title)}</div>
        <div class="eventMeta">${meta}</div>
        <div class="eventLineup">${lineupHTML(e)}</div>
        ${e.notes ? `<div class="eventNotes muted">${esc(e.notes)}</div>` : ""}

        <div style="height:10px;"></div>
        <div class="chips">
          <a class="chip" href="../${e.sideKey}/index.html">Open ${side}</a>
          <a class="chip" href="../${e.sideKey}/booking.html">Booking</a>
        </div>
      </div>

      <div class="eventSide">
        ${sideChip}
        <div class="eventCtas">
          ${ticket}
          <a class="chip" href="../${e.sideKey}/booking.html">Book an act</a>
        </div>
      </div>
    </div>
  `;
}

function setActiveFilter(root, key){
  root.querySelectorAll("[data-filter]").forEach(btn => {
    const on = btn.getAttribute("data-filter") === key;
    btn.classList.toggle("isActive", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
}

function applyFilter(listRoot, key){
  const items = listRoot.querySelectorAll("[data-side]");
  items.forEach(el => {
    const side = el.getAttribute("data-side");
    const show = (key === "all") ? true : side === key;
    el.style.display = show ? "" : "none";
  });
}

export async function mountEventsPage(opts = {}){
  const baseDepth = Number(opts.baseDepth ?? 0);


  const mount = document.querySelector("[data-events-page]");
  const featured = document.querySelector("[data-featured]");
  const countEl = document.querySelector("[data-count]");
  const root = document.querySelector(".eventHero");

  if(!mount || !featured || !root) return;

  mount.innerHTML = `<div class="muted">Loading events…</div>`;
  featured.innerHTML = ``;

  try{
    const data = await loadEvents(baseDepth);

    const all = flatten(data);

    countEl.textContent = `${all.length} event${all.length === 1 ? "" : "s"}`;

    if(!all.length){
      featured.innerHTML = `
        <div class="featureCard">
          <div class="featureTitle">No events yet.</div>
          <div class="featureMeta">When it’s live, it’s live.</div>
          <div class="featureCtas">
            <a class="ctaBtn" href="../tekno/booking.html">Tek booking</a>
            <a class="ctaBtn" href="../hiphop/booking.html">Hip hop booking</a>
          </div>
        </div>
      `;
      mount.innerHTML = `<p class="muted">No events listed.</p>`;
      return;
    }

    // Featured: soonest upcoming
    const next = all[0];
    featured.innerHTML = featureCard(next);

    // List
    mount.innerHTML = `<div class="events">${all.map(listItem).join("")}</div>`;

    // Filtering
    let current = "all";
    root.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        current = btn.getAttribute("data-filter") || "all";
        setActiveFilter(root, current);
        applyFilter(mount, current);
      });
    });

    // default
    setActiveFilter(root, current);
    applyFilter(mount, current);

  }catch(err){
    console.error(err);
    mount.innerHTML = `<p class="muted">Could not load events.</p>`;
    featured.innerHTML = `
      <div class="featureCard">
        <div class="featureTitle">Events temporarily offline</div>
        <div class="featureMeta">Data source not reachable.</div>
      </div>
    `;
  }
}
