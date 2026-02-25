import { sideLabel } from "../js/core/format.js";
import { t } from "../js/core/i18n.js";
import { mountPageRail } from "../js/core/page-rail.js";

function pathPrefix(baseDepth = 0) {
  return "../".repeat(Math.max(0, Number(baseDepth) || 0));
}

function normalizePathname(pathname = "") {
  return String(pathname).replace(/index\.html$/i, "");
}

function isLinkActive(href) {
  const current = normalizePathname(window.location.pathname || "");
  const target = normalizePathname(new URL(href, window.location.origin).pathname);
  return current === target || current.startsWith(`${target}/`);
}

function sideLinks(prefix, sideKey) {
  if (sideKey === "tekno") {
    return [
      { href: `${prefix}pages/tekno/index.html#artists`, label: t("nav.teknoArtists") },
      { href: `${prefix}pages/tekno/booking.html`, label: t("nav.bookTekno") }
    ];
  }

  if (sideKey === "hiphop") {
    return [
      { href: `${prefix}pages/hiphop/index.html#artists`, label: t("nav.hiphopArtists") },
      { href: `${prefix}pages/hiphop/booking.html`, label: t("nav.bookHiphop") }
    ];
  }

  return [];
}

export function renderNav({ sideKey = "global", baseDepth = 0 } = {}) {
  const host = document.querySelector("[data-nav]");
  if (!host) return;

  const prefix = pathPrefix(baseDepth);

  const main = [
    { href: `${prefix}pages/events/index.html`, label: t("nav.events") },
    { href: `${prefix}pages/tekno/index.html`, label: t("nav.tekno") },
    { href: `${prefix}pages/hiphop/index.html`, label: t("nav.hiphop") },
    { href: `${prefix}pages/booking/index.html`, label: t("nav.bookings") },
    { href: `${prefix}pages/shop/index.html`, label: t("nav.shop") }
  ];

  const support = [
    { href: `${prefix}pages/tickets/index.html`, label: t("tickets.hero.title") },
    { href: `${prefix}pages/manifest/index.html`, label: t("nav.manifest") },
    { href: `${prefix}pages/partners/index.html`, label: t("nav.partners") },
    { href: `${prefix}pages/contact/index.html`, label: t("nav.contact") }
  ];

  const secondary = sideLinks(prefix, sideKey);
  const all = [...main, ...secondary, ...support];

  host.innerHTML = `
    <a class="skip-link" href="#main-content">${t("nav.skip")}</a>

    <nav class="kw-nav" aria-label="${t("nav.mainAria")}">
      <div class="kw-nav__inner">
        <a class="kw-brand" href="${prefix}index.html" aria-label="${t("nav.homeAria")}">
          <span class="kw-brand__logo" aria-hidden="true"></span>
          <span class="kw-brand__side">${sideLabel(sideKey)}</span>
          <span class="sr-only">Kwartier West</span>
        </a>

        <div class="kw-links kw-links--main">
          ${main
            .map((item) => {
              const active = isLinkActive(item.href);
              return `<a class="kw-link${active ? " is-active" : ""}" href="${item.href}"${active ? ' aria-current="page"' : ""}>${item.label}</a>`;
            })
            .join("")}
        </div>

        <button class="kw-nav__toggle" type="button" aria-expanded="false" aria-controls="kw-drawer">${t("nav.menu")}</button>
      </div>

      <div class="kw-drawer" id="kw-drawer" hidden>
        <div class="kw-drawer__grid">
          ${all
            .map((item) => {
              const active = isLinkActive(item.href);
              return `<a class="kw-drawer__link${active ? " is-active" : ""}" href="${item.href}"${active ? ' aria-current="page"' : ""}>${item.label}</a>`;
            })
            .join("")}
        </div>
      </div>
    </nav>
  `;

  try {
    mountPageRail({ sideKey, baseDepth });
  } catch (error) {
    console.error("Rail mount failed", error);
  }

  const button = host.querySelector(".kw-nav__toggle");
  const drawer = host.querySelector(".kw-drawer");

  if (!button || !drawer) return;

  function closeDrawer() {
    button.setAttribute("aria-expanded", "false");
    drawer.hidden = true;
    drawer.classList.remove("is-open");
  }

  function openDrawer() {
    button.setAttribute("aria-expanded", "true");
    drawer.hidden = false;
    drawer.classList.add("is-open");
  }

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    if (expanded) closeDrawer();
    else openDrawer();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  drawer.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("a")) {
      closeDrawer();
    }
  });
}
