import { findArtistBySlug, loadArtists } from "./core/content-api.js";
import { asArray, escapeHTML, normalizeSlug, sideLabel } from "./core/format.js";
import { t } from "./core/i18n.js";
import { normalizeSocialLinks, renderSocialRail } from "./core/social-links.js";

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSlug(params.get("slug") || "");
}

function renderFocusList(artist) {
  const focus = asArray(artist?.focus).filter(Boolean);
  const fallback = asArray(artist?.tags).filter(Boolean);
  const values = (focus.length ? focus : fallback).slice(0, 6).map((item) => escapeHTML(item));

  if (!values.length) {
    return `<p class="muted">${t("artist.focusEmpty")}</p>`;
  }

  return `<ul class="artist-detail__list">${values.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderDetailBlocks(artist) {
  const live = escapeHTML(artist?.live || "");
  const focus = renderFocusList(artist);

  return `
    <section class="artist-detail-grid">
      <article class="artist-detail-block">
        <h2>${t("artist.section.focus")}</h2>
        ${focus}
      </article>

      ${
        live
          ? `<article class="artist-detail-block">
              <h2>${t("artist.section.live")}</h2>
              <p>${live}</p>
            </article>`
          : ""
      }
    </section>
  `;
}

export async function renderArtistDetail(sideKey, { baseDepth = 0 } = {}) {
  const root = document.querySelector("[data-artist-root]");
  const heroTitle = document.querySelector("[data-artist-page-title]");
  const heroLead = document.querySelector("[data-artist-page-lead]");
  if (!root) return;

  function setHero(title = "", lead = "") {
    if (heroTitle && title) heroTitle.textContent = title;
    if (heroLead && lead) heroLead.textContent = lead;
  }

  const slug = getSlug();
  if (!slug) {
    root.innerHTML = `<p class="muted">${t("artist.notSelected")}</p>`;
    setHero(t("artists.profile"), t("artist.notSelected"));
    return;
  }

  root.innerHTML = `<p class="muted">${t("artist.loading")}</p>`;

  try {
    const artistsData = await loadArtists({ baseDepth });
    const found = findArtistBySlug(artistsData, slug);

    if (!found) {
      root.innerHTML = `<p class="muted">${t("artist.notFound")}</p>`;
      setHero(t("artists.profile"), t("artist.notFound"));
      return;
    }

    const currentSide = found.sideKey;
    if (sideKey && ["tekno", "hiphop"].includes(sideKey) && sideKey !== currentSide) {
      const wrongSideBody = t("artist.wrongSideBody", {
        name: found.artist.name,
        side: sideLabel(currentSide)
      });
      const wrongSideBodySafe = t("artist.wrongSideBody", {
        name: escapeHTML(found.artist.name),
        side: escapeHTML(sideLabel(currentSide))
      });
      setHero(t("artists.profile"), wrongSideBody);

      root.innerHTML = `
        <div class="surface">
          <h2>${t("artist.wrongSideTitle")}</h2>
          <p class="muted">${wrongSideBodySafe}</p>
          <div class="inline-actions">
            <a class="chip-link" href="../${escapeHTML(currentSide)}/artist.html?slug=${encodeURIComponent(slug)}">${t("artist.openCorrect")}</a>
          </div>
        </div>
      `;
      return;
    }

    const artist = found.artist;
    const photo = escapeHTML(artist.photo || "");
    const name = escapeHTML(artist.name || t("artists.defaultName"));
    const role = escapeHTML(artist.role || t("artists.defaultRole"));
    const city = escapeHTML(artist.city || "");
    const lang = escapeHTML(artist.lang || "");
    const summary = escapeHTML(artist.headline || artist.bio || "");
    const tags = asArray(artist.tags).map((tag) => `<span class="tag-pill">${escapeHTML(tag)}</span>`).join("");
    const signatureLine = escapeHTML(artist.signatureLine || "");
    const artistSlug = normalizeSlug(artist.slug || "");
    const isSpotlightProfile =
      normalizeSlug(artist.profileStyle || "") === "spotlight" ||
      artistSlug === "de-kweker" ||
      artistSlug === "onschuldig";

    const links = normalizeSocialLinks(artist.links);
    const socialRail = renderSocialRail(links, {
      variant: "full",
      limit: 9,
      className: "artist-hero__socials"
    });

    setHero(
      artist.name || t("artists.profile"),
      summary || `${artist.role || t("artists.defaultRole")}${artist.city ? ` - ${artist.city}` : ""}`
    );

    root.innerHTML = `
      <section class="artist-hero${isSpotlightProfile ? " artist-hero--spotlight" : ""}" data-artist="${escapeHTML(artistSlug)}">
        <div class="artist-hero__media${photo ? "" : " is-empty"}">
          ${photo ? `<img src="${photo}" alt="${name}" loading="eager">` : `<span>${t("common.noPhoto")}</span>`}
        </div>

        <div class="artist-hero__body">
          <p class="eyebrow">${escapeHTML(sideLabel(currentSide))} ${escapeHTML(t("artist.collectiveSuffix"))}</p>
          <h1>${name}</h1>
          <p class="artist-hero__meta">${role}${city ? ` <span class="dot-sep"></span> ${city}` : ""}${lang ? ` <span class="dot-sep"></span> ${lang}` : ""}</p>
          ${summary ? `<p class="artist-hero__summary">${summary}</p>` : ""}
          ${tags ? `<div class="artist-hero__tags">${tags}</div>` : ""}

          <div class="artist-hero__connect">
            <p class="eyebrow">${t("artist.section.channels")}</p>
            ${socialRail || `<p class="muted">${t("artist.linksEmpty")}</p>`}
          </div>

          <div class="inline-actions artist-hero__actions">
            <a class="chip-link" href="./booking.html?type=single&artists=${encodeURIComponent(slug)}">${t("artist.bookSolo")}</a>
            <a class="chip-link" href="./booking.html?type=multiple&artists=${encodeURIComponent(slug)}">${t("artist.bookMultiple")}</a>
          </div>
        </div>
      </section>

      ${signatureLine ? `<p class="artist-spotline">${signatureLine}</p>` : ""}

      ${renderDetailBlocks(artist)}
    `;
  } catch (error) {
    console.error(error);
    root.innerHTML = `<p class="muted">${t("events.error")}</p>`;
    setHero(t("artists.profile"), t("events.error"));
  }
}
