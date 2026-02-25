import { t } from "../js/core/i18n.js";

function pathPrefix(baseDepth = 0) {
  return "../".repeat(Math.max(0, Number(baseDepth) || 0));
}

export function renderFooter({ baseDepth = 0 } = {}) {
  const host = document.querySelector("[data-footer]");
  if (!host) return;

  const prefix = pathPrefix(baseDepth);

  host.innerHTML = `
    <footer class="kw-footer" aria-label="Site footer">
      <div class="kw-footer__inner">
        <section class="kw-footer__col" aria-label="Platform">
          <p class="kw-footer__title">Platform</p>
          <a class="kw-footer__link" href="${prefix}pages/events/index.html">${t("nav.events")}</a>
          <a class="kw-footer__link" href="${prefix}pages/booking/index.html">${t("nav.bookingDesk")}</a>
          <a class="kw-footer__link" href="${prefix}pages/shop/index.html">${t("nav.shop")}</a>
          <a class="kw-footer__link" href="${prefix}pages/tickets/index.html">${t("tickets.hero.title")}</a>
        </section>

        <section class="kw-footer__col" aria-label="Collectives">
          <p class="kw-footer__title">Collectives</p>
          <a class="kw-footer__link" href="${prefix}pages/tekno/index.html">${t("nav.tekno")}</a>
          <a class="kw-footer__link" href="${prefix}pages/hiphop/index.html">${t("nav.hiphop")}</a>
          <a class="kw-footer__link" href="${prefix}pages/tekno/booking.html">${t("nav.bookTekno")}</a>
          <a class="kw-footer__link" href="${prefix}pages/hiphop/booking.html">${t("nav.bookHiphop")}</a>
        </section>

        <section class="kw-footer__col" aria-label="Label">
          <p class="kw-footer__title">Label</p>
          <a class="kw-footer__link" href="${prefix}pages/manifest/index.html">${t("nav.manifest")}</a>
          <a class="kw-footer__link" href="${prefix}pages/partners/index.html">${t("nav.partners")}</a>
          <a class="kw-footer__link" href="${prefix}pages/contact/index.html">${t("nav.contact")}</a>
          <span class="kw-footer__note">App integration: coming later</span>
        </section>

        <section class="kw-footer__col" aria-label="Legal and studio">
          <p class="kw-footer__title">Info</p>
          <span class="kw-footer__note">Privacy: coming soon</span>
          <span class="kw-footer__note">Terms: coming soon</span>
          <a class="kw-footer__link" href="mailto:kwartierwest@gmail.com">kwartierwest@gmail.com</a>
          <span class="kw-footer__powered">${t("landing.footer.powered")}</span>
        </section>
      </div>
    </footer>
  `;
}
