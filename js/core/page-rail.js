import { sideLabel } from "./format.js";
import { t } from "./i18n.js";

function laneLabel(sideKey) {
  if (sideKey === "tekno" || sideKey === "hiphop") return sideLabel(sideKey);
  return t("rail.lane.global");
}

export function mountPageRail({ sideKey = "global" } = {}) {
  const shell = document.querySelector(".page-shell");
  if (!shell) return;

  let main = shell.querySelector(":scope > .page-main");
  if (!main) {
    main = document.createElement("div");
    main.className = "page-main";

    const movable = Array.from(shell.children).filter(
      (node) => !(node instanceof HTMLElement && node.matches("[data-page-rail]"))
    );

    movable.forEach((node) => main.append(node));
    shell.prepend(main);
  }

  const showEventRail =
    (sideKey === "tekno" || sideKey === "hiphop") &&
    Boolean(document.querySelector("[data-artists]"));

  let rail = shell.querySelector("[data-page-rail]");
  if (!showEventRail) {
    rail?.remove();
    return;
  }

  if (!rail) {
    rail = document.createElement("aside");
    rail.className = "page-rail";
    rail.setAttribute("data-page-rail", "");
    shell.append(rail);
  }

  rail.innerHTML = `
    <div class="page-rail__stack">
      <section class="page-rail__panel page-rail__panel--lane" aria-label="${t("rail.lane.aria")}">
        <p class="eyebrow">${t("rail.lane.title")}</p>
        <span class="page-rail__logo" aria-hidden="true"></span>
        <p class="page-rail__lane">${laneLabel(sideKey)}</p>
      </section>

      <section class="page-rail__panel page-rail__panel--events" aria-label="${t("nav.events")}">
        <p class="eyebrow">${t("nav.events")}</p>
        <div class="page-rail__events" data-rail-events>
          <p class="muted">${t("events.loading")}</p>
        </div>
      </section>
    </div>
  `;
}
