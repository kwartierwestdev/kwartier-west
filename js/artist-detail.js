import { findArtistBySlug, loadArtists } from "./core/content-api.js";
import { artistPath, asArray, escapeHTML, normalizeSlug, sideLabel } from "./core/format.js";
import { t } from "./core/i18n.js";
import { normalizeSocialLinks, renderSocialRail } from "./core/social-links.js?v=20260226c";

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeSlug(params.get("slug") || "");
  if (querySlug) return querySlug;

  const hashSlug = normalizeSlug(String(window.location.hash || "").replace(/^#slug=/i, ""));
  if (hashSlug) return hashSlug;

  const match = window.location.pathname.match(/\/pages\/(tekno|hiphop)\/artist\/([^/?#]+)/i);
  if (!match?.[2]) return "";

  try {
    return normalizeSlug(decodeURIComponent(match[2]));
  } catch {
    return normalizeSlug(match[2]);
  }
}

function redirectLegacyArtistUrl(sideKey) {
  const pathname = String(window.location.pathname || "");
  if (!/\/pages\/(?:tekno|hiphop)\/artist\.html$/i.test(pathname)) return false;

  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeSlug(params.get("slug") || "");
  const hashSlug = normalizeSlug(String(window.location.hash || "").replace(/^#slug=/i, ""));
  const slug = querySlug || hashSlug;
  if (!slug) return false;

  const safeSide = ["tekno", "hiphop"].includes(sideKey) ? sideKey : "hiphop";
  const destination = artistPath(safeSide, slug);
  const current = `${pathname}${window.location.search || ""}${window.location.hash || ""}`;

  if (!destination || current === destination) return false;
  window.location.replace(destination);
  return true;
}

function absoluteUrl(pathOrUrl) {
  const value = String(pathOrUrl || "").trim();
  if (!value) return "";
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return "";
  }
}

function setMetaByName(name, content) {
  if (!name || !content) return;
  const node = document.querySelector(`meta[name="${name}"]`);
  if (node) node.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (!property || !content) return;
  const node = document.querySelector(`meta[property="${property}"]`);
  if (node) node.setAttribute("content", content);
}

function setCanonical(url) {
  if (!url) return;
  let node = document.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", url);
}

function clearArtistJsonLd() {
  document.querySelectorAll('script[data-artist-jsonld="true"]').forEach((node) => node.remove());
}

function bookingPath(sideKey, type, slug) {
  const safeSide = ["tekno", "hiphop"].includes(sideKey) ? sideKey : "hiphop";
  const safeType = normalizeSlug(type || "single") || "single";
  const params = new URLSearchParams();
  params.set("type", safeType);
  if (slug) params.set("artists", normalizeSlug(slug));
  return `/pages/${safeSide}/booking.html?${params.toString()}`;
}

function normalizeCopy(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function splitStoryParagraphs(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return [];

  const manualParagraphs = clean
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (manualParagraphs.length > 1) return manualParagraphs;

  const sentenceMatches = clean.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [clean];
  const sentences = sentenceMatches.map((part) => part.trim()).filter(Boolean);
  if (sentences.length <= 2) return [clean];

  const grouped = [];
  let bucket = "";
  sentences.forEach((sentence) => {
    const next = bucket ? `${bucket} ${sentence}` : sentence;
    if (next.length > 230 && bucket) {
      grouped.push(bucket);
      bucket = sentence;
      return;
    }
    bucket = next;
  });
  if (bucket) grouped.push(bucket);
  return grouped.length ? grouped : [clean];
}

function applyArtistSeo(artist, sideKey, slug, links = []) {
  const artistName = String(artist?.name || "").trim();
  const sideName = sideLabel(sideKey) || sideKey;
  const summary = String(artist?.headline || artist?.bio || artist?.story || "").trim();
  const safeDescription = summary || `${artistName} binnen ${sideName} van Kwartier West.`;
  const baseUrl = window.location.origin;
  const canonicalUrl = absoluteUrl(artistPath(sideKey, slug));
  const photoUrl = absoluteUrl(artist?.photo);
  const title = artistName ? `${artistName} | Kwartier West` : "Kwartier West - Artiest";

  if (title) {
    document.title = title;
    setMetaByProperty("og:title", title);
    setMetaByName("twitter:title", title);
  }

  if (safeDescription) {
    setMetaByName("description", safeDescription);
    setMetaByProperty("og:description", safeDescription);
    setMetaByName("twitter:description", safeDescription);
  }

  if (canonicalUrl) {
    setCanonical(canonicalUrl);
    setMetaByProperty("og:url", canonicalUrl);
  }

  if (photoUrl) {
    setMetaByProperty("og:image", photoUrl);
    setMetaByProperty("og:image:secure_url", photoUrl);
    setMetaByName("twitter:image", photoUrl);
  }

  clearArtistJsonLd();
  if (!artistName || !canonicalUrl) return;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${canonicalUrl}#artist`,
    name: artistName,
    url: canonicalUrl,
    description: safeDescription,
    genre: [String(sideName || "").trim()].filter(Boolean),
    image: photoUrl || undefined,
    sameAs: links.map((entry) => String(entry?.url || "").trim()).filter(Boolean),
    memberOf: {
      "@type": "Organization",
      name: "Kwartier West",
      url: `${baseUrl}/`
    }
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.artistJsonld = "true";
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

export async function renderArtistDetail(sideKey, { baseDepth = 0 } = {}) {
  const root = document.querySelector("[data-artist-root]");
  const heroTitle = document.querySelector("[data-artist-page-title]");
  const heroLead = document.querySelector("[data-artist-page-lead]");
  if (!root) return;

  if (redirectLegacyArtistUrl(sideKey)) {
    return;
  }

  function setHero(title = "", lead = "") {
    if (heroTitle && title) heroTitle.textContent = title;
    if (heroLead && lead) heroLead.textContent = lead;
  }

  root.innerHTML = `<p class="muted">${t("artist.loading")}</p>`;

  try {
    const artistsData = await loadArtists({ baseDepth });
    const requestedSlug = getSlug();
    let resolvedSlug = requestedSlug;

    if (!resolvedSlug) {
      const preferredSide = asArray(artistsData?.[sideKey]);
      const pool = preferredSide.length
        ? preferredSide
        : [...asArray(artistsData?.hiphop), ...asArray(artistsData?.tekno)];

      const fallback = pool
        .slice()
        .sort((a, b) => Number(b?.priority || 0) - Number(a?.priority || 0))[0];

      const fallbackSlug = normalizeSlug(fallback?.slug || "");
      if (fallbackSlug) {
        resolvedSlug = fallbackSlug;
        const fallbackSide = ["tekno", "hiphop"].includes(sideKey)
          ? sideKey
          : normalizeSlug(fallback?.collective || "hiphop");
        const nextUrl = artistPath(fallbackSide, fallbackSlug);
        window.history.replaceState({}, "", nextUrl);
      }
    }

    if (!resolvedSlug) {
      root.innerHTML = `<p class="muted">${t("artist.notSelected")}</p>`;
      setHero(t("artists.profile"), t("artist.notSelected"));
      return;
    }

    const found = findArtistBySlug(artistsData, resolvedSlug);

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
      applyArtistSeo(found.artist, currentSide, resolvedSlug, normalizeSocialLinks(found.artist.links));
      setHero(t("artists.profile"), wrongSideBody);

      root.innerHTML = `
        <div class="surface">
          <h2>${t("artist.wrongSideTitle")}</h2>
          <p class="muted">${wrongSideBodySafe}</p>
          <div class="inline-actions">
            <a class="chip-link" href="${escapeHTML(artistPath(currentSide, resolvedSlug))}">${t("artist.openCorrect")}</a>
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
    const summaryRaw = String(artist?.headline || artist?.bio || "").trim();
    const storyRaw = String(artist?.story || "").trim();
    const summary = escapeHTML(summaryRaw);
    const hasBioStory = Boolean(storyRaw) && normalizeCopy(storyRaw) !== normalizeCopy(summaryRaw);
    const bioIsLong = hasBioStory && normalizeCopy(storyRaw).length > 320;
    const bioParagraphs = hasBioStory
      ? splitStoryParagraphs(storyRaw).map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")
      : "";
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
    applyArtistSeo(artist, currentSide, resolvedSlug, links);

    setHero(
      artist.name || t("artists.profile"),
      summary || `${artist.role || t("artists.defaultRole")}${artist.city ? ` - ${artist.city}` : ""}`
    );

    root.innerHTML = `
      <section class="artist-hero${isSpotlightProfile ? " artist-hero--spotlight" : ""}" data-artist="${escapeHTML(artistSlug)}">
        <aside class="artist-hero__rail">
          <div class="artist-hero__media${photo ? "" : " is-empty"}">
            ${photo ? `<img src="${photo}" alt="${name}" loading="eager">` : `<span>${t("common.noPhoto")}</span>`}
          </div>
          ${tags ? `<div class="artist-hero__tags">${tags}</div>` : ""}
          <div class="artist-hero__connect">
            <p class="eyebrow">${t("artist.section.channels")}</p>
            ${socialRail || `<p class="muted">${t("artist.linksEmpty")}</p>`}
          </div>
          ${signatureLine ? `<p class="artist-hero__signature">${signatureLine}</p>` : ""}
        </aside>

        <div class="artist-hero__body">
          <p class="eyebrow">${escapeHTML(sideLabel(currentSide))} ${escapeHTML(t("artist.collectiveSuffix"))}</p>
          <h1>${name}</h1>
          <p class="artist-hero__meta">${role}${city ? ` <span class="dot-sep"></span> ${city}` : ""}${lang ? ` <span class="dot-sep"></span> ${lang}` : ""}</p>
          ${summary ? `
            <section class="artist-hero__copy artist-hero__copy--summary">
              <p class="eyebrow artist-hero__copy-label">${t("artist.section.summary")}</p>
              <p class="artist-hero__summary">${summary}</p>
            </section>
          ` : ""}
          ${bioParagraphs ? `
            <section class="artist-hero__copy artist-hero__copy--bio">
              <p class="eyebrow artist-hero__copy-label">${t("artist.section.bio")}</p>
              <div class="artist-hero__bio${bioIsLong ? " is-collapsed" : ""}" data-artist-bio>${bioParagraphs}</div>
              ${bioIsLong ? `<button type="button" class="chip-link artist-hero__bio-toggle" data-artist-bio-toggle aria-expanded="false">${t("artist.bio.expand")}</button>` : ""}
            </section>
          ` : ""}

          <div class="inline-actions artist-hero__actions">
            <a class="chip-link" href="${escapeHTML(bookingPath(currentSide, "single", resolvedSlug))}">${t("artist.bookSolo")}</a>
            <a class="chip-link" href="${escapeHTML(bookingPath(currentSide, "multiple", resolvedSlug))}">${t("artist.bookMultiple")}</a>
          </div>
        </div>
      </section>
    `;

    const bioNode = root.querySelector("[data-artist-bio]");
    const bioToggle = root.querySelector("[data-artist-bio-toggle]");
    if (bioNode && bioToggle) {
      bioToggle.addEventListener("click", () => {
        const isCollapsed = bioNode.classList.toggle("is-collapsed");
        bioToggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        bioToggle.textContent = isCollapsed ? t("artist.bio.expand") : t("artist.bio.collapse");
      });
    }
  } catch (error) {
    console.error(error);
    root.innerHTML = `<p class="muted">${t("events.error")}</p>`;
    setHero(t("artists.profile"), t("events.error"));
  }
}
