function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

export function renderNav({ sideKey="global", baseDepth=0 } = {}){
  const rootPrefix = "../".repeat(baseDepth);
  const toRoot = baseDepth === 0 ? "./" : rootPrefix;

  const links = [
    { label: "Home", href: `${toRoot}index.html` },
    { label: "Tekno", href: `${toRoot}pages/tekno/index.html` },
    { label: "Hip hop", href: `${toRoot}pages/hiphop/index.html` },
    { label: "Tickets", href: `${toRoot}pages/tickets/index.html` },
    { label: "Shop", href: `${toRoot}pages/shop/index.html` },
    { label: "Contact", href: `${toRoot}pages/contact/index.html` }
  ];

  const sideLinks = sideKey === "tekno" || sideKey === "hiphop"
    ? [
        { label: "Booking", href: `./booking.html` },
        { label: "Artists", href: `./index.html#artists` }
      ]
    : [];

  const html = `
    <header class="kwNav">
      <div class="kwNavInner">
        <a class="kwBrand" href="${esc(links[0].href)}">
          <span class="kwMark"></span>
          <span>Kwartier West</span>
        </a>

        <nav class="kwLinks" aria-label="Navigatie">
          ${links.map(l => `<a class="kwLink" href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}
        </nav>

        ${sideLinks.length ? `
          <nav class="kwLinks kwLinksSide" aria-label="Side">
            ${sideLinks.map(l => `<a class="kwLink" href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}
          </nav>
        ` : `<div class="kwLinksSide"></div>`}
      </div>
    </header>
  `;

  const mount = document.querySelector("[data-nav]");
  if(mount) mount.innerHTML = html;
}
