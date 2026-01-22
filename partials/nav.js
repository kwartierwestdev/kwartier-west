/* partials/nav.js — Kwartier West
   Unified navbar (global + tekno + hiphop)
   - NO "Home" link (landing page is home)
   - Adds "Events" in its place
   - Supports baseDepth so links work from any folder depth
*/

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function basePrefix(depth = 0) {
  return "../".repeat(Math.max(0, depth));
}

function link(href, label) {
  return `<a class="kwLink" href="${href}">${esc(label)}</a>`;
}

function groupLinks(base) {
  // Global links (no Home; Events replaces it)
  return [
    { href: `${base}pages/tekno/index.html`, label: "Tekno" },
    { href: `${base}pages/hiphop/index.html`, label: "Hip hop" },
    { href: `${base}pages/events/index.html`, label: "Events" },
    { href: `${base}pages/partners/index.html`, label: "Partners" },
    { href: `${base}pages/tickets/index.html`, label: "Tickets" },
    { href: `${base}pages/shop/index.html`, label: "Shop" },
    { href: `${base}pages/contact/index.html`, label: "Contact" },
  ];
}

function sideLinks(base, sideKey) {
  // Context links shown on the right (only for tekno/hiphop pages)
  if (sideKey === "tekno") {
    return [
      { href: `${base}pages/tekno/booking.html`, label: "Booking" },
      { href: `${base}pages/tekno/index.html#artists`, label: "Artists" },
    ];
  }
  if (sideKey === "hiphop") {
    return [
      { href: `${base}pages/hiphop/booking.html`, label: "Booking" },
      { href: `${base}pages/hiphop/index.html#artists`, label: "Artists" },
    ];
  }
  return [];
}

export function renderNav({ sideKey = "global", baseDepth = 0 } = {}) {
  const mount = document.querySelector("[data-nav]");
  if (!mount) return;

  const base = basePrefix(baseDepth);

  const brandHref = `${base}index.html`; // landing = home
  const main = groupLinks(base);
  const side = sideLinks(base, sideKey);

  mount.innerHTML = `
    <nav class="kwNav" aria-label="Kwartier West">
      <div class="kwNavInner">
        <a class="kwBrand" href="${brandHref}">
          <span class="kwMark" aria-hidden="true"></span>
          <span>Kwartier West</span>
        </a>

        <div class="kwLinks" aria-label="Navigation">
          ${main.map(x => link(x.href, x.label)).join("")}
        </div>

        <div class="kwLinks kwLinksSide" aria-label="Context">
          ${side.map(x => link(x.href, x.label)).join("")}
        </div>

        <div class="kwBurger">
          <button class="kwBurgerBtn" type="button" aria-expanded="false" aria-controls="kwDrawer">
            Menu
          </button>
        </div>
      </div>

      <div class="kwDrawer" id="kwDrawer" hidden>
        <div class="kwDrawerGrid">
          ${main.map(x => `<a href="${x.href}">${esc(x.label)}</a>`).join("")}
          ${side.length ? `<div style="height:6px;"></div>` : ""}
          ${side.map(x => `<a href="${x.href}">${esc(x.label)}</a>`).join("")}
        </div>
      </div>
    </nav>
  `;

  const btn = mount.querySelector(".kwBurgerBtn");
  const drawer = mount.querySelector("#kwDrawer");

  function setOpen(isOpen) {
    btn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      drawer.hidden = false;
      drawer.classList.add("isOpen");
    } else {
      drawer.classList.remove("isOpen");
      drawer.hidden = true;
    }
  }

  setOpen(false);

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  // Close drawer when clicking a link
  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) setOpen(false);
  });

  // Close drawer on Esc
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
