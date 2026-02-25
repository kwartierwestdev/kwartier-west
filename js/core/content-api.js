import { asArray, normalizeSlug, parseISODate } from "./format.js";
import { fetchJSONWithTimeout, resolveEndpoint } from "./integration-client.js";

const DATA_CACHE = new Map();

function buildCandidates(fileName, baseDepth = 0) {
  const cleaned = String(fileName || "").replace(/^\/+/, "");
  const relativePrefix = "../".repeat(Math.max(0, Number(baseDepth) || 0));
  return [`/${cleaned}`, `${relativePrefix}${cleaned}`];
}

async function fetchJSON(candidates, cacheMode = "no-store") {
  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: cacheMode });
      if (!response.ok) {
        lastError = new Error(`Cannot load ${url} (${response.status})`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to load data: ${candidates.join(", ")}`);
}

async function fetchRemoteDataset(endpoint, { baseDepth = 0, timeoutMs = 9000 } = {}) {
  const url = resolveEndpoint(endpoint, baseDepth);
  if (!url) throw new Error("Remote endpoint is empty");
  return fetchJSONWithTimeout(url, { timeoutMs, cache: "no-store" });
}

export async function loadDataset(fileName, { baseDepth = 0, revalidate = false } = {}) {
  const key = `${fileName}|${baseDepth}`;
  if (!revalidate && DATA_CACHE.has(key)) {
    return DATA_CACHE.get(key);
  }

  const data = await fetchJSON(buildCandidates(fileName, baseDepth));
  if (!revalidate) DATA_CACHE.set(key, data);
  return data;
}

export function clearDataCache() {
  DATA_CACHE.clear();
}

export function pickSideCollection(data, sideKey) {
  if (Array.isArray(data?.[sideKey])) return data[sideKey];
  return [];
}

export async function loadArtists(options = {}) {
  return loadDataset("data/artists.json", options);
}

export async function loadEvents(options = {}) {
  const { baseDepth = 0, revalidate = false, useRemote = true } = options;
  const localLoader = () => loadDataset("data/events.json", { baseDepth, revalidate });
  if (!useRemote) return localLoader();

  const integrations = await loadIntegrations({ baseDepth, revalidate });
  const syncConfig = integrations?.eventSync || {};

  if (syncConfig.enabled && syncConfig.endpoint) {
    try {
      return await fetchRemoteDataset(syncConfig.endpoint, {
        baseDepth,
        timeoutMs: Number(syncConfig.timeoutMs || 9000)
      });
    } catch (error) {
      console.warn("Remote event sync unavailable, using local events.json", error);
    }
  }

  return localLoader();
}

export async function loadPartners(options = {}) {
  return loadDataset("data/partners.json", options);
}

export async function loadShop(options = {}) {
  const { baseDepth = 0, revalidate = false, useRemote = true } = options;
  const localLoader = () => loadDataset("data/shop.json", { baseDepth, revalidate });
  if (!useRemote) return localLoader();

  const integrations = await loadIntegrations({ baseDepth, revalidate });
  const shopConfig = integrations?.shopApi || {};

  if (shopConfig.enabled && shopConfig.endpoint) {
    try {
      return await fetchRemoteDataset(shopConfig.endpoint, {
        baseDepth,
        timeoutMs: Number(shopConfig.timeoutMs || 9000)
      });
    } catch (error) {
      console.warn("Remote shop API unavailable, using local shop.json", error);
    }
  }

  return localLoader();
}

export async function loadIntegrations(options = {}) {
  try {
    return await loadDataset("data/integrations.json", options);
  } catch {
    return {
      eventSync: { enabled: false },
      bookingWebhook: { enabled: false },
      shopApi: { enabled: false }
    };
  }
}

export function findArtistBySlug(artistsData, slug) {
  const target = normalizeSlug(slug);
  if (!target) return null;

  for (const sideKey of ["tekno", "hiphop"]) {
    const found = asArray(artistsData?.[sideKey]).find((artist) => normalizeSlug(artist?.slug) === target);
    if (found) {
      return { artist: found, sideKey };
    }
  }

  return null;
}

export function normalizeLineup(lineup, artistsData, fallbackSideKey = "tekno") {
  return asArray(lineup)
    .map((entry) => {
      const slug = entry?.slug || "";
      const resolved = slug ? findArtistBySlug(artistsData, slug) : null;

      if (resolved) {
        return {
          slug: resolved.artist.slug,
          name: resolved.artist.name,
          sideKey: resolved.sideKey
        };
      }

      return {
        slug: slug || "",
        name: entry?.name || slug || "Onbekend",
        sideKey: fallbackSideKey
      };
    })
    .filter((entry) => entry.name);
}

function eventTimestamp(eventItem) {
  const date = parseISODate(eventItem?.date);
  return date ? date.getTime() : Number.POSITIVE_INFINITY;
}

export function flattenEvents(eventsData) {
  const merged = [];

  for (const sideKey of ["tekno", "hiphop"]) {
    for (const eventItem of asArray(eventsData?.[sideKey])) {
      merged.push({ ...eventItem, sideKey });
    }
  }

  merged.sort((a, b) => eventTimestamp(a) - eventTimestamp(b));
  return merged;
}

export function splitEventsByDate(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  for (const eventItem of asArray(events)) {
    const date = parseISODate(eventItem?.date);
    if (!date) {
      upcoming.push(eventItem);
      continue;
    }

    if (date.getTime() < today.getTime()) past.push(eventItem);
    else upcoming.push(eventItem);
  }

  return { upcoming, past };
}
