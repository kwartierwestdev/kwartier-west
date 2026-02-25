import { getCurrentLocale, t } from "./i18n.js";

const DATE_CACHE = new Map();

function getDateFormatter(locale = "nl-BE", options = {}) {
  const key = `${locale}|${JSON.stringify(options)}`;
  if (!DATE_CACHE.has(key)) {
    DATE_CACHE.set(key, new Intl.DateTimeFormat(locale, options));
  }
  return DATE_CACHE.get(key);
}

export function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseISODate(dateISO) {
  if (typeof dateISO !== "string") return null;
  const trimmed = dateISO.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const timestamp = Date.parse(`${trimmed}T00:00:00`);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export function formatDate(dateISO, locale = "") {
  const chosenLocale = locale || getCurrentLocale();
  const date = parseISODate(dateISO);
  if (!date) return t("common.datePending");
  return getDateFormatter(chosenLocale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(dateISO, time = "", locale = "") {
  const d = formatDate(dateISO, locale || getCurrentLocale());
  const t = typeof time === "string" && time.trim() ? time.trim() : null;
  return t ? `${d} - ${t}` : d;
}

export function sideLabel(sideKey) {
  if (sideKey === "tekno") return "Tekno";
  if (sideKey === "hiphop") return "Hip hop";
  return "Kwartier West";
}

export function sideShortLabel(sideKey) {
  if (sideKey === "tekno") return "TEK";
  if (sideKey === "hiphop") return "HIP HOP";
  return "KW";
}

export function sidePath(sideKey) {
  if (sideKey === "tekno" || sideKey === "hiphop") return sideKey;
  return "events";
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

export function bookingReference() {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0")
  ].join("");

  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KW-${stamp}-${rand}`;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeSlug(value = "") {
  return String(value || "").trim().toLowerCase();
}
