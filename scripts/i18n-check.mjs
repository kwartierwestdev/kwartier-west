import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("js/core/i18n.js");
const source = fs.readFileSync(filePath, "utf8");

function extractObjectBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not extract block between "${startMarker}" and "${endMarker}".`);
  }

  return source.slice(start, end);
}

function parseEntries(block) {
  const result = new Map();
  const entryRegex = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;

  while ((match = entryRegex.exec(block)) !== null) {
    const key = match[1];
    const value = match[2];
    result.set(key, value);
  }

  return result;
}

function placeholders(value) {
  return new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
}

function reportDiff(label, valuesA, valuesB) {
  const missing = [...valuesA.keys()].filter((key) => !valuesB.has(key));
  const extra = [...valuesB.keys()].filter((key) => !valuesA.has(key));

  if (missing.length) {
    console.error(`${label}: missing keys (${missing.length})`);
    missing.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }

  if (extra.length) {
    console.error(`${label}: extra keys (${extra.length})`);
    extra.slice(0, 20).forEach((key) => console.error(`  + ${key}`));
  }

  return missing.length + extra.length;
}

function reportPlaceholderMismatches(enMap, nlMap) {
  let count = 0;

  for (const [key, enValue] of enMap.entries()) {
    const nlValue = nlMap.get(key);
    if (typeof nlValue !== "string") continue;

    const enPlaceholders = placeholders(enValue);
    const nlPlaceholders = placeholders(nlValue);

    const missingInNl = [...enPlaceholders].filter((token) => !nlPlaceholders.has(token));
    const extraInNl = [...nlPlaceholders].filter((token) => !enPlaceholders.has(token));

    if (missingInNl.length || extraInNl.length) {
      count += 1;
      console.error(`Placeholder mismatch in key "${key}"`);
      if (missingInNl.length) console.error(`  Missing in NL: ${missingInNl.join(", ")}`);
      if (extraInNl.length) console.error(`  Extra in NL: ${extraInNl.join(", ")}`);
    }
  }

  return count;
}

function reportEmptyValues(label, entries) {
  const empty = [...entries.entries()].filter(([, value]) => !String(value).trim()).map(([key]) => key);
  if (empty.length) {
    console.error(`${label}: empty values (${empty.length})`);
    empty.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }
  return empty.length;
}

const ALLOWED_IDENTICAL_VALUES = new Set([
  "nav.menu",
  "nav.tekno",
  "nav.hiphop",
  "nav.partners",
  "nav.contact",
  "nav.manifest",
  "meta.home.title",
  "meta.tekno.title",
  "meta.hiphop.title",
  "meta.contact.title",
  "meta.manifest.title",
  "meta.partners.title",
  "meta.tickets.title",
  "landing.tekno.title",
  "landing.tekno.book",
  "landing.hiphop.title",
  "landing.hiphop.book",
  "landing.footer.partners",
  "landing.footer.contact",
  "footer.title.platform",
  "footer.title.label",
  "footer.title.info",
  "tekno.hero.eyebrow",
  "hiphop.hero.eyebrow",
  "events.filter.tekno",
  "events.filter.hiphop",
  "events.lineup",
  "events.ticketsLabel",
  "booking.form.budget",
  "booking.form.placeholder.eventName",
  "booking.form.placeholder.city",
  "booking.form.placeholder.attendance",
  "booking.form.placeholder.budget",
  "booking.form.placeholder.setLength",
  "booking.form.placeholder.phone",
  "booking.summary.budget",
  "booking.summary.contact",
  "shop.filter.label",
  "shop.filter.tekno",
  "shop.filter.hiphop",
  "partners.hero.title",
  "contact.hero.title",
  "manifest.hero.title",
  "tickets.hero.title"
]);

function reportUnexpectedIdenticalValues(enEntries, nlEntries) {
  const identical = [...enEntries.entries()]
    .filter(([key, value]) => nlEntries.get(key) === value && !ALLOWED_IDENTICAL_VALUES.has(key))
    .map(([key]) => key);

  if (identical.length) {
    console.error(`Unexpected identical EN/NL values (${identical.length})`);
    identical.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }

  return identical.length;
}

function reportHtmlEntities(label, entries) {
  const hasEntities = [...entries.entries()]
    .filter(([, value]) => /&#\d+;|&#x[0-9a-f]+;|&[a-z]+;/i.test(value))
    .map(([key]) => key);

  if (hasEntities.length) {
    console.error(`${label}: contains HTML entities (${hasEntities.length})`);
    hasEntities.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }

  return hasEntities.length;
}

const enBlock = extractObjectBlock("const EN = {", "const NL = {");
const nlBlock = extractObjectBlock("const NL = {", "const MESSAGES = {");

const enMap = parseEntries(enBlock);
const nlMap = parseEntries(nlBlock);

let errors = 0;
errors += reportDiff("i18n parity", enMap, nlMap);
errors += reportPlaceholderMismatches(enMap, nlMap);
errors += reportEmptyValues("EN", enMap);
errors += reportEmptyValues("NL", nlMap);
errors += reportUnexpectedIdenticalValues(enMap, nlMap);
errors += reportHtmlEntities("EN", enMap);
errors += reportHtmlEntities("NL", nlMap);

if (errors > 0) {
  console.error(`i18n-check failed with ${errors} issue(s).`);
  process.exit(1);
}

console.log(`i18n-check passed (${enMap.size} keys, placeholders aligned).`);
