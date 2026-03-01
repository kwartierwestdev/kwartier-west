import fs from "node:fs/promises";
import path from "node:path";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value = "") {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadArtists() {
  const file = path.join(process.cwd(), "data", "artists.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

function findArtist(artists, side, slug) {
  const pool = Array.isArray(artists?.[side]) ? artists[side] : [];
  return pool.find((entry) => normalize(entry?.slug) === normalize(slug)) || null;
}

function metaDescription(artist) {
  const line = String(artist?.headline || artist?.bio || artist?.story || "").replace(/\s+/g, " ").trim();
  if (!line) return "Detailpagina van artiest binnen Kwartier West.";
  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
}

function buildHtml({ origin, side, slug, artist }) {
  const safeSide = side === "tekno" ? "tekno" : "hiphop";
  const sideTitle = safeSide === "tekno" ? "Tekno" : "Hip hop";
  const canonical = `${origin}/pages/${safeSide}/artist/${encodeURIComponent(slug)}`;
  const title = artist?.name ? `${artist.name} | Kwartier West` : `Kwartier West - ${sideTitle} artiest`;
  const description = metaDescription(artist);
  const ogImage = `${origin}/api/artist-og?side=${encodeURIComponent(safeSide)}&slug=${encodeURIComponent(slug)}`;
  const ogAlt = artist?.name ? `${artist.name} | Kwartier West` : "Kwartier West artiest";

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Kwartier West">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="/css/base.css?v=20260226d">
</head>
<body class="kw-page kw-side-${safeSide} kw-page--artist">
  <div data-nav></div>

  <main id="main-content" class="page-shell">
    <header class="hero-surface hero-surface--lane hero-surface--lane-${safeSide} hero-surface--artist">
      <p class="eyebrow" data-i18n="artist.hero.eyebrow${safeSide === "tekno" ? "Tekno" : "Hiphop"}">${sideTitle} / Artiestprofiel</p>
      <h1 data-i18n="artists.profile" data-artist-page-title>Profiel</h1>
      <p class="lead" data-i18n="artist.loading" data-artist-page-lead>Artiest laden...</p>
      <div class="inline-actions">
        <a class="chip-link" href="/pages/${safeSide}/index.html#artists" data-i18n="nav.${safeSide}Artists">${sideTitle} artiesten</a>
        <a class="chip-link" href="/pages/${safeSide}/booking.html" data-i18n="nav.book${safeSide === "tekno" ? "Tekno" : "Hiphop"}">Boek ${sideTitle}</a>
      </div>
    </header>

    <div data-sideswitch></div>

    <section class="surface surface--artist-detail">
      <div data-artist-root></div>
    </section>
  </main>

  <div data-footer></div>

  <script type="module">
    import { initI18nPage } from "/js/core/i18n.js";
    import { renderNav } from "/partials/nav.js";
    import { renderFooter } from "/partials/footer.js";
    import { renderSideSwitch } from "/partials/side-switch.js";
    import { renderArtistDetail } from "/js/artist-detail.js?v=20260301a";

    const isCleanArtistRoute = /\\/pages\\/${safeSide}\\/artist\\/[^/?#]+$/i.test(window.location.pathname || "");
    const baseDepth = isCleanArtistRoute ? 3 : 2;

    initI18nPage();
    renderNav({ sideKey: "${safeSide}", baseDepth });
    renderFooter({ baseDepth });
    renderSideSwitch("${safeSide}");
    renderArtistDetail("${safeSide}", { baseDepth });
  </script>
</body>
</html>`;
}

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, "https://kwartierwest.be");
    const side = normalize(url.searchParams.get("side")) === "tekno" ? "tekno" : "hiphop";
    const slug = normalize(url.searchParams.get("slug"));

    const artists = await loadArtists();
    const artist = findArtist(artists, side, slug);
    const safeSlug = artist?.slug ? normalize(artist.slug) : slug || "artist";
    const origin = `${request.headers["x-forwarded-proto"] || "https"}://${request.headers.host || "kwartierwest.be"}`;

    response.setHeader("content-type", "text/html; charset=utf-8");
    response.setHeader("cache-control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400");
    response.status(200).send(buildHtml({ origin, side, slug: safeSlug, artist }));
  } catch (error) {
    response.status(500).send("Artist page render error.");
  }
}
