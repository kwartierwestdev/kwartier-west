import { t } from "../js/core/i18n.js";

export function renderSideSwitch(sideKey) {
  if (!["tekno", "hiphop"].includes(sideKey)) return;

  const mount = document.querySelector("[data-sideswitch]");
  if (!mount) return;

  const other = sideKey === "tekno" ? "hiphop" : "tekno";
  const otherLabel = other === "tekno" ? t("nav.tekno") : t("nav.hiphop");
  const thisLabel = sideKey === "tekno" ? t("nav.tekno") : t("nav.hiphop");

  mount.innerHTML = `
    <div class="side-switch" role="navigation" aria-label="${t("nav.sideSwitchAria")}">
      <span class="side-switch__label">${thisLabel}</span>
      <a class="side-switch__link" href="../${other}/index.html">${otherLabel}</a>
      <a class="side-switch__link" href="../booking/index.html?side=${sideKey}">${t("nav.bookingDesk")}</a>
    </div>
  `;
}
