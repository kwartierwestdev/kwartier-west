import { findArtistBySlug, loadArtists, loadShop } from "./core/content-api.js";
import { artistPath, asArray, escapeHTML, normalizeSlug, sideLabel } from "./core/format.js";
import { t } from "./core/i18n.js";
import { renderSocialRail } from "./core/social-links.js";

const FILTERS = [
  { key: "all", labelKey: "shop.filter.all" },
  { key: "tekno", labelKey: "shop.filter.tekno" },
  { key: "hiphop", labelKey: "shop.filter.hiphop" },
  { key: "available", labelKey: "shop.filter.available" }
];

const LANE_ORDER = ["global", "tekno", "hiphop"];

function statusLabel(status) {
  switch (status) {
    case "in_stock":
      return t("shop.status.inStock");
    case "preorder":
      return t("shop.status.preorder");
    case "sold_out":
      return t("shop.status.soldOut");
    case "coming_soon":
      return t("shop.status.comingSoon");
    default:
      return t("shop.status.tba");
  }
}

function statusClass(status) {
  if (["in_stock", "preorder"].includes(status)) return "is-live";
  if (status === "sold_out") return "is-off";
  return "is-soon";
}

function laneLabel(side) {
  if (side === "global") return t("shop.filter.label");
  if (side === "tekno") return t("shop.filter.tekno");
  if (side === "hiphop") return t("shop.filter.hiphop");
  return sideLabel(side);
}

function resolveOwner(item, artistsData) {
  if (item.ownerType === "label") {
    return {
      label: "Kwartier West",
      href: "../../pages/manifest/index.html",
      links: [
        { platform: "instagram", label: "@kwtr_west", url: "https://www.instagram.com/kwtr_west/" },
        { platform: "soundcloud", label: "Kwartier West", url: "https://soundcloud.com/kwartier-west" }
      ]
    };
  }

  const found = findArtistBySlug(artistsData, item.artistSlug);
  if (!found) {
    return { label: item.ownerName || t("artists.defaultRole"), href: "", links: [] };
  }

  return {
    label: found.artist.name,
    href: artistPath(found.sideKey, found.artist.slug),
    links: found.artist.links || []
  };
}

function renderItem(item, artistsData) {
  const owner = resolveOwner(item, artistsData);
  const side = sideLabel(item.side);
  const image = escapeHTML(item.image || "");
  const price = Number(item.price || 0);
  const sizes = asArray(item.sizes);
  const stateLabel = statusLabel(item.status);
  const ownerSocials = renderSocialRail(owner.links, {
    variant: "icon",
    limit: 3,
    className: "shop-item__socials"
  });

  return `
    <article class="shop-item" data-filter-owner="${escapeHTML(item.ownerType || "artists")}" data-filter-side="${escapeHTML(item.side || "global")}" data-filter-status="${escapeHTML(item.status || "coming_soon")}">
      <div class="shop-item__media${image ? "" : " is-empty"}">
        ${image ? `<img src="${image}" alt="${escapeHTML(item.title || "Merch artikel")}" loading="lazy">` : `<span>${escapeHTML(t("common.noPhoto"))}</span>`}
      </div>

      <div class="shop-item__body">
        <div class="shop-item__head">
          <span class="shop-item__status ${statusClass(item.status)}">${stateLabel}</span>
          <span class="shop-item__price">${price ? `EUR ${price.toFixed(2)}` : t("shop.price.tba")}</span>
        </div>

        <h3 class="shop-item__title">${escapeHTML(item.title || "Zonder titel")}</h3>

        <p class="shop-item__meta">
          ${owner.href ? `<a class="inline-link" href="${escapeHTML(owner.href)}">${escapeHTML(owner.label)}</a>` : escapeHTML(owner.label)}
          <span class="dot-sep"></span>
          ${escapeHTML(side)}
        </p>

        <div class="shop-item__foot">
          ${sizes.length ? `<span class="shop-item__sizes">${t("shop.sizes")}: ${sizes.map((size) => escapeHTML(size)).join(", ")}</span>` : `<span class="shop-item__sizes muted">${t("shop.sizes")}: -</span>`}
          ${ownerSocials || ""}
          ${item.url ? `<a class="shop-item__link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">${t("shop.product.open")}</a>` : `<span class="shop-item__pending">${t("shop.product.pending")}</span>`}
        </div>
      </div>
    </article>
  `;
}

function groupByLane(items) {
  const lanes = new Map();
  LANE_ORDER.forEach((side) => lanes.set(side, []));

  items.forEach((item) => {
    const sideKey = LANE_ORDER.includes(item.side) ? item.side : "global";
    lanes.get(sideKey)?.push(item);
  });

  return LANE_ORDER
    .map((side) => ({ side, items: lanes.get(side) || [] }))
    .filter((lane) => lane.items.length);
}

function renderLane(lane, artistsData) {
  const laneCount = t("shop.count", { count: lane.items.length });

  return `
    <section class="shop-lane shop-lane--${escapeHTML(lane.side)}">
      <header class="shop-lane__head">
        <h2 class="shop-lane__title">${escapeHTML(laneLabel(lane.side))}</h2>
        <span class="shop-lane__count">${escapeHTML(laneCount)}</span>
      </header>
      <div class="shop-lane__list">
        ${lane.items.map((item) => renderItem(item, artistsData)).join("")}
      </div>
    </section>
  `;
}

function matchFilter(item, filterKey) {
  if (filterKey === "all") return true;
  if (filterKey === "label") return item.ownerType === "label";
  if (filterKey === "artists") return item.ownerType !== "label";
  if (filterKey === "tekno" || filterKey === "hiphop") return item.side === filterKey;
  if (filterKey === "available") return ["in_stock", "preorder"].includes(item.status);
  if (filterKey === "coming_soon") return item.status === "coming_soon";
  return true;
}

export async function mountShopPage({ baseDepth = 0 } = {}) {
  const listRoot = document.querySelector("[data-shop-items]");
  const filtersRoot = document.querySelector("[data-shop-filters]");
  const countRoot = document.querySelector("[data-shop-count]");
  const searchRoot = document.querySelector("[data-shop-search]");

  if (!listRoot || !filtersRoot || !countRoot) return;

  listRoot.innerHTML = `<p class="muted">${t("shop.loading")}</p>`;

  try {
    const [shopData, artistsData] = await Promise.all([
      loadShop({ baseDepth }),
      loadArtists({ baseDepth })
    ]);

    const items = asArray(shopData?.items).map((item) => ({
      ...item,
      ownerType: item.ownerType || "artists",
      side: item.side || "global",
      status: item.status || "coming_soon"
    }));

    if (!items.length) {
      listRoot.innerHTML = `<p class="muted">${t("shop.empty")}</p>`;
      return;
    }

    let activeFilter = "all";
    let searchQuery = "";

    function paintButtons() {
      filtersRoot.innerHTML = FILTERS.map((filter) => {
        const active = filter.key === activeFilter;
        return `<button type="button" class="shop-filter-btn${active ? " is-active" : ""}" data-shop-filter="${filter.key}" aria-pressed="${active ? "true" : "false"}">${t(filter.labelKey)}</button>`;
      }).join("");

      filtersRoot.querySelectorAll("[data-shop-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          activeFilter = button.getAttribute("data-shop-filter") || "all";
          paint();
        });
      });
    }

    function paint() {
      const visibleItems = items.filter((item) => {
        if (!matchFilter(item, activeFilter)) return false;

        if (!searchQuery) return true;

        const haystack = [item.title, item.description, item.ownerName, item.artistSlug]
          .map((value) => normalizeSlug(value || ""))
          .join(" ");

        return haystack.includes(searchQuery);
      });

      countRoot.textContent = t("shop.count", { count: visibleItems.length });
      const lanes = groupByLane(visibleItems);
      listRoot.innerHTML = `<div class="shop-stream">${lanes.map((lane) => renderLane(lane, artistsData)).join("")}</div>`;

      if (!visibleItems.length) {
        listRoot.innerHTML = `<p class="muted">${t("shop.empty")}</p>`;
      }

      paintButtons();
    }

    searchRoot?.addEventListener("input", () => {
      searchQuery = normalizeSlug(searchRoot.value || "");
      paint();
    });

    paint();
  } catch (error) {
    console.error(error);
    listRoot.innerHTML = `<p class="muted">${t("shop.error")}</p>`;
  }
}

