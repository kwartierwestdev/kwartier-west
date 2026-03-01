import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SITE_ORIGIN = "https://www.kwartierwest.be";
const WIDTH = 1200;
const HEIGHT = 630;
const PHOTO_X = 54;
const PHOTO_Y = 54;
const PHOTO_W = 430;
const PHOTO_H = 522;
const LOGO_W = 320;
const LOGO_H = 92;
const LOGO_X = 530;
const LOGO_Y = 72;
const NAME_X = 530;
const NAME_Y = 214;

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function escapeXml(value = "") {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitNameLines(name = "", maxCharsPerLine = 18) {
  const clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean) return ["KWARTIER WEST"];

  const words = clean.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === 2) break;
  }
  if (current && lines.length < 2) lines.push(current);

  const out = lines.slice(0, 2);
  if (!out.length) out.push(clean.slice(0, maxCharsPerLine));
  if (out.length === 2 && words.join(" ").length > out.join(" ").length) {
    out[1] = `${out[1].slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd()}...`;
  }
  return out;
}

async function loadArtists() {
  const file = path.join(process.cwd(), "data", "artists.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

function pickArtist(artistsData, sideKey, slug) {
  const safeSide = normalize(sideKey);
  const safeSlug = normalize(slug);
  const pools = safeSide && Array.isArray(artistsData?.[safeSide])
    ? [artistsData[safeSide]]
    : [artistsData?.hiphop || [], artistsData?.tekno || []];

  for (const pool of pools) {
    const found = (pool || []).find((entry) => normalize(entry?.slug) === safeSlug);
    if (found) return { artist: found, sideKey: safeSide || normalize(found?.collective || "hiphop") };
  }

  const fallback = (artistsData?.hiphop || [])[0] || (artistsData?.tekno || [])[0] || null;
  if (!fallback) return { artist: null, sideKey: "hiphop" };
  return { artist: fallback, sideKey: normalize(fallback?.collective || "hiphop") };
}

function sideLabel(sideKey = "") {
  return normalize(sideKey) === "tekno" ? "TEKNO" : "HIP HOP";
}

function panelSvg() {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#080808"/>
      <stop offset="72%" stop-color="#0b0b0b"/>
      <stop offset="100%" stop-color="#210505"/>
    </linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8f1414" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#8f1414" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#red)"/>
  <g opacity="0.16" stroke="#ffffff" stroke-width="1">
    ${Array.from({ length: 26 }, (_, i) => `<line x1="${i * 48}" y1="0" x2="${i * 48}" y2="${HEIGHT}"/>`).join("")}
    ${Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 48}" x2="${WIDTH}" y2="${i * 48}"/>`).join("")}
  </g>
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="2"/>
  <rect x="${PHOTO_X - 14}" y="${PHOTO_Y - 14}" width="${PHOTO_W + 28}" height="${PHOTO_H + 28}" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="2"/>
  <rect x="516" y="54" width="630" height="522" fill="rgba(8,8,8,0.48)" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
  <line x1="530" y1="514" x2="1120" y2="514" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
</svg>`;
}

function textSvg({ side, name }) {
  const [line1, line2 = ""] = splitNameLines(name, 18);
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="${NAME_X}" y="${NAME_Y}" fill="#f0f0f0" font-size="24" font-family="Arial, sans-serif" letter-spacing="5">${escapeXml(side)} COLLECTIEF</text>
  <text x="${NAME_X}" y="${NAME_Y + 98}" fill="#ffffff" font-size="86" font-weight="800" font-family="Arial, sans-serif">${escapeXml(line1)}</text>
  ${line2 ? `<text x="${NAME_X}" y="${NAME_Y + 184}" fill="#ffffff" font-size="86" font-weight="800" font-family="Arial, sans-serif">${escapeXml(line2)}</text>` : ""}
</svg>`;
}

async function fetchPhotoBuffer(origin, photoPath) {
  const fallback = `${origin}/assets/og/og-cover.png?v=20260226a`;
  const source = String(photoPath || "").trim();
  const url = source ? (/^https?:\/\//i.test(source) ? source : `${origin}${source}`) : fallback;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`photo ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch {
    const response = await fetch(fallback, { cache: "no-store" });
    return Buffer.from(await response.arrayBuffer());
  }
}

async function fetchLogoBuffer(origin) {
  const logoUrl = `${origin}/assets/kw-wordmark-real.png`;
  const response = await fetch(logoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`logo ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, "https://kwartierwest.be");
    const origin = SITE_ORIGIN;
    const side = normalize(url.searchParams.get("side"));
    const slug = normalize(url.searchParams.get("slug"));

    const artistsData = await loadArtists();
    const picked = pickArtist(artistsData, side, slug);
    const artist = picked.artist || {};

    const name = String(artist?.name || "Kwartier West").trim();
    const sideText = sideLabel(picked.sideKey);

    const photoBuffer = await fetchPhotoBuffer(origin, artist?.photo);
    const photoPng = await sharp(photoBuffer)
      .resize(PHOTO_W, PHOTO_H, { fit: "cover" })
      .png()
      .toBuffer();

    const logoBuffer = await fetchLogoBuffer(origin);
    const logoPng = await sharp(logoBuffer)
      .resize(LOGO_W, LOGO_H, { fit: "contain" })
      .png()
      .toBuffer();

    const panel = Buffer.from(panelSvg());
    const textLayer = Buffer.from(textSvg({ side: sideText, name }));
    const output = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 4,
        background: "#090909"
      }
    })
      .composite([
        { input: panel, left: 0, top: 0 },
        { input: photoPng, left: PHOTO_X, top: PHOTO_Y },
        { input: logoPng, left: LOGO_X, top: LOGO_Y },
        { input: textLayer, left: 0, top: 0 }
      ])
      .png()
      .toBuffer();

    response.setHeader("content-type", "image/png");
    response.setHeader("cache-control", "public, max-age=900, s-maxage=900, stale-while-revalidate=86400");
    response.status(200).send(output);
  } catch {
    response.status(500).send("Artist OG render error.");
  }
}
