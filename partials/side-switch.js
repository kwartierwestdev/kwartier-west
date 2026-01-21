function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

export function renderSideSwitch(sideKey){
  // bovenaan in renderSideSwitch
if (window.matchMedia("(min-width: 901px)").matches) return;

  const mount = document.querySelector("[data-sideswitch]");
  if(!mount) return;

  const other = sideKey === "tekno" ? "hiphop" : "tekno";
  const otherLabel = sideKey === "tekno" ? "Hip hop" : "Tekno";
  const thisLabel  = sideKey === "tekno" ? "Tekno" : "Hip hop";
  const otherHref  = `../${other}/index.html`;

  mount.innerHTML = `
    <div class="sideSwitch" role="navigation" aria-label="Side switch">
      <div class="sideSwitchPill">
        <span class="sideHere">${esc(thisLabel)}</span>
        <span class="sideSep">→</span>
        <a class="sideGo" href="${esc(otherHref)}">Switch to ${esc(otherLabel)}</a>
      </div>
    </div>
  `;
}
