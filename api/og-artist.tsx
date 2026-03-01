import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge"
};

const WIDTH = 1200;
const HEIGHT = 630;

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function sideLabel(sideKey = "") {
  return normalize(sideKey) === "tekno" ? "TEKNO" : "HIP HOP";
}

function escapeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function loadArtists(origin: string) {
  const response = await fetch(`${origin}/data/artists.json`, {
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`artists.json ${response.status}`);
  return response.json();
}

function pickArtist(artistsData: any, sideKey: string, slug: string) {
  const safeSide = normalize(sideKey);
  const safeSlug = normalize(slug);
  const pools = safeSide && Array.isArray(artistsData?.[safeSide])
    ? [artistsData[safeSide]]
    : [artistsData?.hiphop || [], artistsData?.tekno || []];

  for (const pool of pools) {
    const found = (pool || []).find((entry: any) => normalize(entry?.slug) === safeSlug);
    if (found) return { artist: found, sideKey: safeSide || normalize(found?.collective || "hiphop") };
  }

  const fallback = (artistsData?.hiphop || [])[0] || (artistsData?.tekno || [])[0] || null;
  if (!fallback) return { artist: null, sideKey: "hiphop" };
  return { artist: fallback, sideKey: normalize(fallback?.collective || "hiphop") };
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const slug = normalize(url.searchParams.get("slug"));
  const sideKey = normalize(url.searchParams.get("side"));

  let artist: any = null;
  let resolvedSide = sideKey || "hiphop";

  try {
    const artistsData = await loadArtists(origin);
    const picked = pickArtist(artistsData, sideKey, slug);
    artist = picked.artist;
    resolvedSide = picked.sideKey;
  } catch {
    artist = null;
  }

  const name = escapeText(artist?.name || "Kwartier West");
  const role = escapeText(artist?.role || "Artist");
  const city = escapeText(artist?.city || "Belgium");
  const photoPath = String(artist?.photo || "/assets/og/og-cover.png?v=20260226a").trim();
  const photoUrl = /^https?:\/\//i.test(photoPath) ? photoPath : `${origin}${photoPath}`;
  const ogTitle = `${name} | Kwartier West`;
  const ogSide = sideLabel(resolvedSide);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(110% 130% at 100% 0%, rgba(173, 18, 18, 0.42), rgba(8, 8, 8, 0.98) 62%), #050505",
          color: "#f6f6f6",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px, 44px 44px",
            opacity: 0.35
          }}
        />

        <div
          style={{
            margin: "52px",
            width: "1096px",
            height: "526px",
            border: "2px solid rgba(255,255,255,0.26)",
            display: "flex",
            alignItems: "stretch",
            position: "relative",
            zIndex: 2
          }}
        >
          <div
            style={{
              width: "38%",
              height: "100%",
              display: "flex",
              padding: "20px",
              borderRight: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            <img
              src={photoUrl}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.22)"
              }}
            />
          </div>

          <div
            style={{
              width: "62%",
              padding: "40px 44px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  fontSize: 24,
                  letterSpacing: "0.2em",
                  opacity: 0.86
                }}
              >
                {ogSide} COLLECTIEF
              </div>
              <div
                style={{
                  fontSize: 82,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: "0.02em"
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 36, opacity: 0.9 }}>{role}</div>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{city}</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "16px"
              }}
            >
              <div style={{ fontSize: 28, letterSpacing: "0.08em", fontWeight: 700 }}>
                KWARTIER WEST
              </div>
              <div style={{ fontSize: 18, opacity: 0.75 }}>{ogTitle}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "cache-control": "public, max-age=900, s-maxage=900, stale-while-revalidate=86400"
      }
    }
  );
}
