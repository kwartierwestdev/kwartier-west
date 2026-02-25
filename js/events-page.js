import {
  flattenEvents,
  loadArtists,
  loadEvents,
  normalizeLineup,
  splitEventsByDate
} from "./core/content-api.js";
import { escapeHTML, formatDateTime, sideLabel, sideShortLabel } from "./core/format.js";
import { t } from "./core/i18n.js";

function listLineup(eventItem, artistsData) {
  const lineup = normalizeLineup(eventItem?.lineup, artistsData, eventItem?.sideKey);
  if (!lineup.length) return `<span class="muted">${t("events.lineupPending")}</span>`;

  return lineup
    .map((entry) => {
      const path = `../${entry.sideKey}/artist.html?slug=${encodeURIComponent(entry.slug || "")}`;
      const label = escapeHTML(entry.name || t("artists.defaultName"));
      if (!entry.slug) return `<span>${label}</span>`;
      return `<a class="inline-link" href="${path}">${label}</a>`;
    })
    .join('<span class="dot-sep"></span>');
}

function ticketCTA(eventItem) {
  const mode = eventItem?.tickets?.mode || "tba";
  const url = eventItem?.tickets?.url || "";
  const label = eventItem?.tickets?.label || t("events.ticketsLabel");

  if (mode === "external" && url) {
    return `<a class="chip-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
  }
  if (mode === "internal") {
    return `<a class="chip-link" href="../tickets/index.html">${t("events.ticketsLabel")}</a>`;
  }
  return `<span class="muted">${t("events.ticketsTba")}</span>`;
}

function sourceMarkup(eventItem) {
  const source = eventItem?.source;
  if (!source?.url) return "";
  const platform = source?.platform || t("events.sourceDefault");
  return `<a class="chip-link" href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(platform)} ${t("events.source")}</a>`;
}

function featuredCard(eventItem, artistsData) {
  const title = escapeHTML(eventItem?.title || t("events.untitled"));
  const meta = escapeHTML(formatDateTime(eventItem?.date, eventItem?.time));
  const location = [eventItem?.region, eventItem?.venue].filter(Boolean).map(escapeHTML).join(" - ");

  return `
    <article class="feature-card">
      <div class="feature-card__top">
        <span class="status-pill">${escapeHTML(sideShortLabel(eventItem?.sideKey))}</span>
        <span class="status-pill">${escapeHTML(eventItem?.status || t("events.filter.upcoming"))}</span>
      </div>

      <h3>${title}</h3>
      <p class="feature-card__meta">${meta}${location ? ` <span class="dot-sep"></span> ${location}` : ""}</p>

      <p class="feature-card__lineup"><span class="muted">${t("events.lineup")}:</span> ${listLineup(eventItem, artistsData)}</p>

      <div class="inline-actions">
        ${ticketCTA(eventItem)}
        <a class="chip-link" href="../${escapeHTML(eventItem.sideKey)}/booking.html?type=collective_side">${t("events.bookSide", { side: escapeHTML(sideLabel(eventItem.sideKey)) })}</a>
        ${sourceMarkup(eventItem)}
      </div>
    </article>
  `;
}

function listItem(eventItem, artistsData) {
  const dateLabel = escapeHTML(formatDateTime(eventItem?.date, eventItem?.time));
  const location = [eventItem?.region, eventItem?.venue].filter(Boolean).map(escapeHTML).join(" - ");
  const sideChip = `<span class="status-pill">${escapeHTML(sideShortLabel(eventItem.sideKey))}</span>`;
  const statusChip = `<span class="status-pill">${escapeHTML(
    eventItem?.status || (eventItem.__isPast ? t("events.filter.past") : t("events.filter.upcoming"))
  )}</span>`;
  const source = sourceMarkup(eventItem);

  return `
    <article class="event-card" data-side="${escapeHTML(eventItem.sideKey)}" data-scope="${eventItem.__isPast ? "past" : "upcoming"}">
      <div class="event-card__main">
        <h3 class="event-card__title">${escapeHTML(eventItem?.title || t("events.untitled"))}</h3>
        <p class="event-card__meta">${dateLabel}${location ? ` <span class="dot-sep"></span> ${location}` : ""}</p>
        <p class="event-card__lineup"><span class="event-card__label">${t("events.lineup")}:</span> ${listLineup(eventItem, artistsData)}</p>
        ${source ? `<p class="event-card__source">${source}</p>` : ""}
      </div>

      <div class="event-card__actions">
        <div class="event-card__badges">${sideChip}${statusChip}</div>
        <div class="event-card__cta-group">
          <div class="event-card__cta">${ticketCTA(eventItem)}</div>
          <div class="event-card__cta">
            <a class="chip-link" href="../${escapeHTML(eventItem.sideKey)}/booking.html?type=collective_side">${t("events.bookSide", {
              side: escapeHTML(sideLabel(eventItem.sideKey))
            })}</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function applyFilter({ side = "all", scope = "upcoming" } = {}) {
  const items = document.querySelectorAll("[data-events-page] [data-side]");
  let visible = 0;

  for (const item of items) {
    const sideMatch = side === "all" || item.getAttribute("data-side") === side;
    const scopeMatch = scope === "all" || item.getAttribute("data-scope") === scope;
    const show = sideMatch && scopeMatch;
    item.hidden = !show;
    item.setAttribute("aria-hidden", show ? "false" : "true");
    if (show) visible += 1;
  }

  const visibleNode = document.querySelector("[data-visible-count]");
  if (visibleNode) {
    visibleNode.textContent = t("events.visible", { count: visible });
  }
}

function setupFilterButtons() {
  let side = "all";
  let scope = "upcoming";

  const sideButtons = document.querySelectorAll("[data-filter-side]");
  const scopeButtons = document.querySelectorAll("[data-filter-scope]");

  function paint() {
    sideButtons.forEach((button) => {
      const active = button.getAttribute("data-filter-side") === side;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    scopeButtons.forEach((button) => {
      const active = button.getAttribute("data-filter-scope") === scope;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    applyFilter({ side, scope });
  }

  sideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      side = button.getAttribute("data-filter-side") || "all";
      paint();
    });
  });

  scopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      scope = button.getAttribute("data-filter-scope") || "upcoming";
      paint();
    });
  });

  paint();
}

export async function mountEventsPage({ baseDepth = 0 } = {}) {
  const listRoot = document.querySelector("[data-events-page]");
  const featuredRoot = document.querySelector("[data-featured]");
  const totalNode = document.querySelector("[data-count]");

  if (!listRoot || !featuredRoot) return;

  listRoot.innerHTML = `<p class="muted">${t("events.loading")}</p>`;

  try {
    const [eventsData, artistsData] = await Promise.all([
      loadEvents({ baseDepth }),
      loadArtists({ baseDepth })
    ]);

    const merged = flattenEvents(eventsData);
    const { upcoming, past } = splitEventsByDate(merged);
    const ordered = [...upcoming, ...past.slice().reverse()].map((eventItem) => ({
      ...eventItem,
      __isPast: past.includes(eventItem)
    }));

    if (totalNode) {
      totalNode.textContent = t("events.total", { count: merged.length });
    }

    if (!ordered.length) {
      featuredRoot.innerHTML = `<p class="muted">${t("events.none")}</p>`;
      listRoot.innerHTML = `<p class="muted">${t("events.none")}</p>`;
      return;
    }

    const featured = upcoming[0] || ordered[0];
    featuredRoot.innerHTML = featuredCard(featured, artistsData);

    listRoot.innerHTML = `<div class="event-list">${ordered.map((eventItem) => listItem(eventItem, artistsData)).join("")}</div>`;

    setupFilterButtons();
  } catch (error) {
    console.error(error);
    featuredRoot.innerHTML = `<p class="muted">${t("events.error")}</p>`;
    listRoot.innerHTML = `<p class="muted">${t("events.error")}</p>`;
  }
}
