import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const PHOTO_X = 54;
const PHOTO_Y = 54;
const PHOTO_W = 430;
const PHOTO_H = 522;

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

function panelSvg({ name, role, city, side }) {
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
  <text x="530" y="130" fill="#f3f3f3" font-size="28" font-family="Arial, sans-serif" letter-spacing="7">${escapeXml(side)} COLLECTIEF</text>
  <text x="530" y="250" fill="#f8f8f8" font-size="94" font-weight="800" font-family="Arial, sans-serif">${escapeXml(name)}</text>
  <text x="530" y="328" fill="#e8e8e8" font-size="40" font-family="Arial, sans-serif">${escapeXml(role)}</text>
  <text x="530" y="378" fill="#d7d7d7" font-size="30" font-family="Arial, sans-serif">${escapeXml(city)}</text>
  <line x1="530" y1="514" x2="1120" y2="514" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
  <text x="530" y="556" fill="#ffffff" font-size="34" font-weight="700" font-family="Arial, sans-serif" letter-spacing="4">KWARTIER WEST</text>
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

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, "https://kwartierwest.be");
    const origin = `${request.headers["x-forwarded-proto"] || "https"}://${request.headers.host || "kwartierwest.be"}`;
    const side = normalize(url.searchParams.get("side"));
    const slug = normalize(url.searchParams.get("slug"));

    const artistsData = await loadArtists();
    const picked = pickArtist(artistsData, side, slug);
    const artist = picked.artist || {};

    const name = String(artist?.name || "Kwartier West").trim();
    const role = String(artist?.role || "Artist").trim();
    const city = String(artist?.city || "Belgium").trim();
    const sideText = sideLabel(picked.sideKey);

    const photoBuffer = await fetchPhotoBuffer(origin, artist?.photo);
    const photoPng = await sharp(photoBuffer)
      .resize(PHOTO_W, PHOTO_H, { fit: "cover" })
      .png()
      .toBuffer();

    const panel = Buffer.from(panelSvg({ name, role, city, side: sideText }));
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
        { input: photoPng, left: PHOTO_X, top: PHOTO_Y }
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
