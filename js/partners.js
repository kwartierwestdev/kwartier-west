import { loadPartners } from "./core/content-api.js";
import { asArray, escapeHTML } from "./core/format.js";
import { t } from "./core/i18n.js";
import { renderSocialRail } from "./core/social-links.js";

function initials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "KW";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function renderTags(tags) {
  const list = asArray(tags).filter(Boolean).slice(0, 3);
  if (!list.length) return "";
  return `<div class="partner-card__tags">${list.map((tag) => `<span class="tag-pill">${escapeHTML(tag)}</span>`).join("")}</div>`;
}

function partnerCard(partner) {
  const name = escapeHTML(partner?.name || "Partner");
  const type = escapeHTML(partner?.type || "");
  const region = escapeHTML(partner?.region || "");
  const links = renderSocialRail(partner?.links, {
    variant: "full",
    limit: 5,
    className: "partner-card__socials"
  });

  return `
    <article class="tile-card tile-card--partner">
      <div class="partner-card__head">
        <div class="partner-card__mark" aria-hidden="true">${escapeHTML(initials(partner?.name || ""))}</div>

        <div class="partner-card__title">
          <h3>${name}</h3>
          ${type ? `<p class="muted">${type}</p>` : ""}
        </div>
      </div>

      ${region ? `<p class="partner-card__meta muted">${region}</p>` : ""}
      ${renderTags(partner?.tags)}

      <div class="partner-card__actions">
        ${links || `<span class="muted">${t("partners.linksPending")}</span>`}
      </div>
    </article>
  `;
}

export async function renderPartners({ baseDepth = 0 } = {}) {
  const mount = document.querySelector("[data-partners]");
  if (!mount) return;

  mount.innerHTML = `<p class="muted">${t("partners.loading")}</p>`;

  try {
    const data = await loadPartners({ baseDepth });
    const partners = asArray(data?.partners);

    if (!partners.length) {
      mount.innerHTML = `<p class="muted">${t("partners.empty")}</p>`;
      return;
    }

    mount.innerHTML = `<div class="tile-grid">${partners.map((partner) => partnerCard(partner)).join("")}</div>`;
  } catch (error) {
    console.error(error);
    mount.innerHTML = `<p class="muted">${t("partners.error")}</p>`;
  }
}
