import { t } from "./core/i18n.js";

const CENTER_LEFT = 0.44;
const CENTER_RIGHT = 0.56;
const EDGE_HYSTERESIS = 0.02;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setActive(root, side) {
  const safe = side === "tekno" || side === "hiphop" || side === "rift" ? side : "none";
  if (root.getAttribute("data-active") !== safe) {
    root.setAttribute("data-active", safe);
  }
  return safe;
}

function sideFromX(canvas, clientX, previous = "none") {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return "none";
  const ratio = (clientX - rect.left) / rect.width;
  if (ratio < 0 || ratio > 1) return "none";

  if (previous === "tekno" && ratio < CENTER_RIGHT - EDGE_HYSTERESIS) return "tekno";
  if (previous === "hiphop" && ratio > CENTER_LEFT + EDGE_HYSTERESIS) return "hiphop";

  if (ratio < CENTER_LEFT) return "tekno";
  if (ratio > CENTER_RIGHT) return "hiphop";
  return "rift";
}

const RIFT_VARIANTS = {
  main: {
    href: "./pages/events/index.html",
    aria: "landing.rift.main.aria",
    title: "landing.rift.main.title"
  },
  tekno: {
    href: "./pages/tekno/index.html",
    aria: "landing.rift.tekno.aria",
    title: "landing.rift.tekno.title"
  },
  hiphop: {
    href: "./pages/hiphop/index.html",
    aria: "landing.rift.hiphop.aria",
    title: "landing.rift.hiphop.title"
  }
};

function riftVariantFor(side) {
  if (side === "tekno") return "tekno";
  if (side === "hiphop") return "hiphop";
  return "main";
}

function updateRift(root, refs, side) {
  const variantName = riftVariantFor(side);
  const variant = RIFT_VARIANTS[variantName];
  if (!variant) return;

  root.setAttribute("data-rift-target", variantName);
  refs.link.setAttribute("href", variant.href);
  refs.link.setAttribute("aria-label", t(variant.aria));
  refs.title.textContent = t(variant.title);
}

export function initLandingPortal() {
  const root = document.querySelector("[data-portal]");
  const canvas = document.querySelector("[data-portal-canvas]");
  const tekno = document.querySelector('[data-portal-side="tekno"]');
  const hiphop = document.querySelector('[data-portal-side="hiphop"]');
  const manifest = document.querySelector(".portal-rift__manifest");
  const riftTitle = document.querySelector(".portal-rift__manifest-title");

  if (!root || !canvas || !tekno || !hiphop || !manifest || !riftTitle) return;

  const reduced = prefersReducedMotion();
  const riftRefs = {
    link: manifest,
    title: riftTitle
  };
  let pointerX = null;
  let rafId = 0;

  updateRift(root, riftRefs, "none");

  if (!reduced) {
    const flushPointer = () => {
      rafId = 0;
      if (pointerX === null) return;
      const current = root.getAttribute("data-active") || "none";
      const side = sideFromX(canvas, pointerX, current);
      const active = setActive(root, side);
      updateRift(root, riftRefs, active);
    };

    canvas.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      if (rafId) return;
      rafId = window.requestAnimationFrame(flushPointer);
    });
  }

  canvas.addEventListener("pointerleave", () => {
    pointerX = null;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    const active = setActive(root, "none");
    updateRift(root, riftRefs, active);
  });

  [tekno, hiphop].forEach((link) => {
    link.addEventListener("focus", () => {
      const active = setActive(root, link.dataset.portalSide || "none");
      updateRift(root, riftRefs, active);
    });
  });

  manifest.addEventListener("focus", () => {
    const active = setActive(root, "rift");
    updateRift(root, riftRefs, active);
  });

  document.addEventListener("focusin", (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (!root.contains(event.target)) {
      const active = setActive(root, "none");
      updateRift(root, riftRefs, active);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!root.contains(document.activeElement)) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const active = setActive(root, "tekno");
      updateRift(root, riftRefs, active);
      tekno.focus();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const active = setActive(root, "hiphop");
      updateRift(root, riftRefs, active);
      hiphop.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const active = setActive(root, "rift");
      updateRift(root, riftRefs, active);
      manifest.focus();
    } else if (event.key === "Escape") {
      const active = setActive(root, "none");
      updateRift(root, riftRefs, active);
    }
  });
}
