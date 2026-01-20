export function renderNav({ sideKey = "global", baseDepth = 0 } = {}) {
  const prefix = "../".repeat(baseDepth);

  const linksMain = [
    { href: `${prefix}index.html`, label: "Home" },
    { href: `${prefix}pages/tekno/index.html`, label: "Tekno" },
    { href: `${prefix}pages/hiphop/index.html`, label: "Hip hop" },
    { href: `${prefix}pages/tickets/index.html`, label: "Tickets" },
    { href: `${prefix}pages/shop/index.html`, label: "Shop" },
    { href: `${prefix}pages/contact/index.html`, label: "Contact" },
  ];

  const linksSide =
    sideKey === "tekno"
      ? [
          { href: `${prefix}pages/tekno/booking.html`, label: "Booking" },
          { href: `${prefix}pages/tekno/index.html#artists`, label: "Artists" },
        ]
      : sideKey === "hiphop"
      ? [
          { href: `${prefix}pages/hiphop/booking.html`, label: "Booking" },
          { href: `${prefix}pages/hiphop/index.html#artists`, label: "Artists" },
        ]
      : [{ href: `${prefix}pages/manifest/index.html`, label: "Manifest" }];

  const allLinks = [...linksMain, ...linksSide];

  const host = document.querySelector("[data-nav]");
  if (!host) return;

  host.innerHTML = `
    <nav class="kwNav" aria-label="Kwartier West navigation">
      <div class="kwNavInner">
        <a class="kwBrand" href="${prefix}index.html" aria-label="Kwartier West home">
          <span class="kwMark" aria-hidden="true"></span>
          <span>Kwartier West</span>
        </a>

        <div class="kwLinks">
          ${linksMain.map(a => `<a class="kwLink" href="${a.href}">${a.label}</a>`).join("")}
        </div>

        <div class="kwLinks kwLinksSide">
          ${linksSide.map(a => `<a class="kwLink" href="${a.href}">${a.label}</a>`).join("")}
        </div>

        <div class="kwBurger" aria-hidden="true">
          <button class="kwBurgerBtn" type="button" aria-expanded="false" aria-controls="kwDrawer">
            Menu
          </button>
        </div>
      </div>

      <div class="kwDrawer" id="kwDrawer">
        <div class="kwDrawerGrid">
          ${allLinks.map(a => `<a href="${a.href}">${a.label}</a>`).join("")}
        </div>
      </div>
    </nav>
  `;

  // Only activate burger on mobile
  const mq = window.matchMedia("(max-width: 900px)");
  const btn = host.querySelector(".kwBurgerBtn");
  const drawer = host.querySelector(".kwDrawer");
  const burgerWrap = host.querySelector(".kwBurger");

  function syncBurger() {
    const isMobile = mq.matches;

    if (burgerWrap) burgerWrap.style.display = isMobile ? "flex" : "none";
    if (drawer) drawer.classList.remove("isOpen");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  syncBurger();
  mq.addEventListener?.("change", syncBurger);

  if (btn && drawer) {
    btn.addEventListener("click", () => {
      const open = drawer.classList.toggle("isOpen");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
}
