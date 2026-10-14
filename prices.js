/**
 * SafaiKaro Centralized Pricing — Single Source of Truth
 *
 * To update prices: change the numbers below.
 * All pages auto-populate from this file via [data-price] attributes.
 *
 * Usage in HTML:
 *   <span data-price="fumigation-s">Rs 7,000</span>
 *   <span data-price="termite-ml">Rs 20,000</span>
 *   <span data-price="annual-s-monthly">Rs 1,833</span>
 *
 * The inner text is a fallback if JS doesn't load.
 */

// Five size tiers per service (all at 50% markup over cost):
//   -s  = up to 100 sq yd     -m  = 101–200 sq yd     -ml = 201–300 sq yd
//   -l  = 301–500 sq yd       -xl = 501–1,000 sq yd
var SAFAIKARO_PRICES = {
  // General Fumigation
  'fumigation-s':  7000,   // ≤100 sq yd — cost 3000
  'fumigation-m':  11000,  // 101–200 sq yd — cost 5000
  'fumigation-ml': 13000,  // 201–300 sq yd — cost 6000
  'fumigation-l':  16000,  // 301–500 sq yd — cost 7500
  'fumigation-xl': 20000,  // 501–1,000 sq yd — cost 9500

  // Termite Treatment
  'termite-s':  13000,  // ≤100 sq yd — cost 6000
  'termite-m':  17000,  // 101–200 sq yd — cost 8000
  'termite-ml': 20000,  // 201–300 sq yd — cost 9500
  'termite-l':  27000,  // 301–500 sq yd — cost 13000
  'termite-xl': 37000,  // 501–1,000 sq yd — cost 18000

  // Bed Bug Treatment
  'bedbug-s':  11000,  // ≤100 sq yd — cost 5000
  'bedbug-m':  14000,  // 101–200 sq yd — cost 6500
  'bedbug-ml': 17000,  // 201–300 sq yd — cost 8000
  'bedbug-l':  23000,  // 301–500 sq yd — cost 11000
  'bedbug-xl': 29000,  // 501–1,000 sq yd — cost 14000

  // Rodent Control (tiered by property size, 2 visits included)
  'rodent-s':  13000,  // ≤100 sq yd — cost 6000
  'rodent-m':  16000,  // 101–200 sq yd — cost 7500
  'rodent-ml': 18000,  // 201–300 sq yd — cost 8500
  'rodent-l':  21000,  // 301–500 sq yd — cost 10000
  'rodent-xl': 29000,  // 501–1,000 sq yd — cost 14000
  // Legacy alias — resolves to base tier so any missed old
  // data-price="rodent" reference still renders a valid price.
  'rodent': 13000,

  // Mosquito Control
  'mosquito-s':  6000,
  'mosquito-m':  8000,
  'mosquito-l':  12000,
  'mosquito-xl': 18000,

  // Annual Shield (competitive but profitable)
  'annual-s':  18000,
  'annual-m':  24000,
  'annual-l':  40000,
  'annual-xl': 65000,

  // Site survey (fixed fee for the visit; a written quote follows. Not free, not adjusted against the job)
  'site-survey': 1000,  // Rs 1,000 always

  // Deposit
  'deposit': 500
};

(function() {
  function formatPrice(amount) {
    return 'Rs ' + amount.toLocaleString('en-PK');
  }

  // Annual Shield saving = what 4 separate quarterly fumigation visits would cost
  // minus the annual plan, for the same property size. Annual Shield has no 201-300
  // tier of its own (annual-l covers 201-500), so 201-300 compares against annual-l.
  var ANNUAL_VISITS = 4;
  var SAVING_TIERS = ['s', 'm', 'ml', 'l', 'xl'];
  function annualSaving(tier) {
    var annual = SAFAIKARO_PRICES['annual-' + tier];
    if (annual === undefined && tier === 'ml') annual = SAFAIKARO_PRICES['annual-l'];
    var visit = SAFAIKARO_PRICES['fumigation-' + tier];
    if (annual === undefined || visit === undefined) return null;
    return ANNUAL_VISITS * visit - annual;
  }
  function maxAnnualSaving() {
    var best = null;
    for (var t = 0; t < SAVING_TIERS.length; t++) {
      var v = annualSaving(SAVING_TIERS[t]);
      if (v !== null && (best === null || v > best)) best = v;
    }
    return best;
  }
  window.SAFAIKARO_SAVING = function(tier) { return tier === 'max' ? maxAnnualSaving() : annualSaving(tier); };

  function populatePrices() {
    // Update all [data-price] elements
    var els = document.querySelectorAll('[data-price]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-price');
      if (SAFAIKARO_PRICES[key] !== undefined) {
        els[i].textContent = formatPrice(SAFAIKARO_PRICES[key]);
      }
    }

    // Update all [data-saving] elements: data-saving="annual-m" or "annual-max"
    var sav = document.querySelectorAll('[data-saving]');
    for (var k = 0; k < sav.length; k++) {
      var tier = sav[k].getAttribute('data-saving').replace(/^annual-/, '');
      var amount = window.SAFAIKARO_SAVING(tier);
      if (amount !== null) sav[k].textContent = formatPrice(amount);
    }

    // Update JSON-LD schema prices if present
    var schemas = document.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < schemas.length; j++) {
      try {
        var data = JSON.parse(schemas[j].textContent);
        var updated = updateSchemaPrice(data);
        if (updated) {
          schemas[j].textContent = JSON.stringify(data, null, 2);
        }
      } catch(e) { /* skip invalid JSON-LD */ }
    }
  }

  function updateSchemaPrice(obj) {
    var changed = false;
    // Update offers.price or priceRange
    if (obj && (obj['@type'] === 'LocalBusiness' || obj['@type'] === 'PestControlService')) {
      // Only re-sync the generic sitewide range (fumigation-s .. termite-xl).
      // Pages with a service-specific priceRange (e.g. bed bugs 11,000-29,000)
      // keep their own — overwriting them broke rich-result pricing on 9 pages.
      if (obj.priceRange && /7,?000/.test(obj.priceRange) && /37,?000/.test(obj.priceRange)) {
        obj.priceRange = 'Rs ' + SAFAIKARO_PRICES['fumigation-s'].toLocaleString('en-PK') + ' – Rs ' + SAFAIKARO_PRICES['termite-xl'].toLocaleString('en-PK');
        changed = true;
      }
    }
    return changed;
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populatePrices);
  } else {
    populatePrices();
  }
})();

/**
 * Page class and segment for attribution (offices, restaurants, schools ... vs homes).
 * The rules are kept in sync with the segment map; keep them identical (a test compares them).
 * $1 means: take the segment from the first capture group (paid /l/<segment>-<angle> pages).
 */
/* segments:begin */
var SK_SEGMENTS = [{"path_regex": "^/l/dengue-[a-z-]+$", "class": "residential", "segment": "mosquito"}, {"path_regex": "^/l/(.+)-[a-z]+$", "class": "commercial", "segment": "$1"}, {"path_regex": "^/commercial$", "class": "commercial", "segment": "hub"}, {"path_regex": "^/commercial-pest-control-pricing-karachi$", "class": "commercial", "segment": "pricing"}, {"path_regex": "^/restaurant-pest-control-karachi$", "class": "commercial", "segment": "restaurant"}, {"path_regex": "^/hotel-pest-control-karachi$", "class": "commercial", "segment": "hotel"}, {"path_regex": "^/clinic-hospital-pest-control-karachi$", "class": "commercial", "segment": "clinic"}, {"path_regex": "^/society-building-pest-control-karachi$", "class": "commercial", "segment": "building"}, {"path_regex": "^/warehouse-godown-pest-control-karachi$", "class": "commercial", "segment": "warehouse"}, {"path_regex": "^/office-fumigation-karachi$", "class": "commercial", "segment": "office"}, {"path_regex": "^/school-fumigation-service-karachi$", "class": "commercial", "segment": "school"}, {"path_regex": "^/pest-control-contract-karachi$", "class": "commercial", "segment": "contract"}, {"path_regex": "^/fumigation-certificate-karachi$", "class": "commercial", "segment": "certificate"}, {"path_regex": "^/(commercial-cleaning|commercial-kitchen-cleaning|office-cleaning-services|post-construction-cleaning)-karachi$", "class": "commercial", "segment": "cleaning"}, {"path_regex": "^/blog/commercial-cleaning-[a-z0-9-]+$", "class": "commercial", "segment": "cleaning"}, {"path_regex": "^/blog/([a-z0-9]+-)*(restaurants?|cafes?|bakery|hotels?|offices?|clinics?|hospitals?|schools?|warehouses?|godowns?|factory|factories|commercial|business|contracts?|amc)(-[a-z0-9]+)*$", "class": "commercial", "segment": "article"}, {"path_regex": "^/pest-control-korangi-industrial-area-karachi$", "class": "mixed", "segment": "industrial"}, {"path_regex": "^/apartment-fumigation-karachi$", "class": "mixed", "segment": "apartment"}, {"path_regex": "^/$", "class": "residential", "segment": "home"}, {"path_regex": "^/book$", "class": "residential", "segment": "booking"}, {"path_regex": "^/pest-control-price-list-karachi$", "class": "residential", "segment": "pricing"}, {"path_regex": "^/pest-control-karachi-areas$", "class": "residential", "segment": "areas"}, {"path_regex": "^/pest-control-[a-z0-9-]+-karachi$", "class": "residential", "segment": "area"}, {"path_regex": "^/(fumigation-services|annual-pest-control|termite-treatment|termite-treatment-new-construction|mosquito-dengue-control|cockroach-control|rodent-control|bed-bug-treatment|bee-wasp-removal|ant-control|lizard-control)-karachi$", "class": "residential", "segment": "service"}, {"path_regex": "^/blog$", "class": "residential", "segment": "blog"}, {"path_regex": "^/blog/[a-z0-9-]+$", "class": "residential", "segment": "blog"}];
/* segments:end */
function skNormalize(p) {
  p = String(p || '/').split('#')[0].split('?')[0].replace(/^https?:\/\/[^\/]+/, '');
  p = p.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}
function skClassify(path) {
  var p = skNormalize(path);
  for (var i = 0; i < SK_SEGMENTS.length; i++) {
    var r = SK_SEGMENTS[i], m = new RegExp(r.path_regex).exec(p);
    if (m) return [r['class'], r.segment === '$1' ? (m[1] || '') : r.segment];
  }
  return ['unclassified', ''];
}

/**
 * Conversion tracking via PostHog (initialised on every page).
 * One delegated, capture-phase click listener records WhatsApp / Book / Call
 * intent across the whole site — no per-link wiring needed.
 *
 * WHY sendBeacon: these CTAs navigate the SAME tab (wa.me, /book). A normal
 * async capture() is cancelled when the browser unloads to WhatsApp / /book
 * before the request is sent, so the event is lost (this is why only the
 * target="_blank" float used to register). transport:'sendBeacon' +
 * send_instantly hands the event to the browser's beacon queue, which is
 * delivered even as the page unloads. No preventDefault — the link is never
 * blocked, so a tracking failure can never break a CTA.
 *
 * Events: whatsapp_click, book_click, call_click, email_click (mailto:, a lead event), share_click (data-share or wa.me/?text=, not a lead)
 * Every event carries page_class, page_segment, entry_class, entry_segment (spec: segments map above).
 *   { path, text, href, cta, section, prefill, ref }
 *
 * cta = WHERE the click happened, derived from the DOM at click time so no
 * page markup needs tagging (35% of WhatsApp clicks used to arrive with empty
 * text because the float pill is icon-only, making placement unreadable).
 * An explicit data-cta="..." on the anchor or any ancestor wins.
 *
 * whatsapp_open_unconfirmed { cta, in_app, path }: fired 4 s after a
 *   whatsapp_click if the page never went hidden in between (the tap
 *   probably did not open WhatsApp), so repeat taps read as retries, not
 *   extra contacts. in_app names an in-app browser token when present.
 *
 * Micro-conversions (same listener, buttons not links):
 *   faq_open { question, path }   .faq-q
 *   price_tab_change { tab, path } .price-tab
 *   nav_menu_open { path }         .hamburger
 */
/**
 * Footer WhatsApp prefill (the shared footer links wa.me with no message, so footer taps used to arrive blank).
 * The footer link gets a prefill from the page path at load time; an explicit ?text= is left alone. Commercial
 * pages run first and lead with the segment noun and "site survey" (the survey costs Rs 1,000; never call it
 * free), then area pages, then services. No codes in the customer's message (founder ruling); paid /l/ pages
 * keep their own Ref. The delegated listener below reads the prefill off the href at click time.
 */
var SK_PREFILL = (function () {
  var COMMERCIAL_BY_PATH = [
    [/restaurant|cafe|bakery|cloud-kitchen/, 'restaurant', 'pest control for my restaurant'],
    [/hotel/, 'hotel', 'pest control for my hotel'],
    [/clinic|hospital/, 'clinic', 'pest control for my clinic'],
    [/office-fumigation/, 'office', 'pest control for my office'],
    [/school-fumigation/, 'school', 'pest control for my school'],
    [/warehouse|godown|korangi-industrial/, 'factory or godown', 'pest control for my factory or godown'],
    [/society-building/, 'building', 'pest control for our building'],
    [/pest-control-contract/, 'contract', 'a pest control contract for my business'],
    [/commercial-pest-control-pricing|^\/commercial$/, 'business', 'pest control for my business']
  ];
  var SERVICE_BY_PATH = [
    [/fumigation-certificate/, 'a fumigation certificate for my premises'],
    [/fumigation-services|apartment-fumigation|school-fumigation|office-fumigation|fumigation-kya-hoti-hai|fumigation-vs-pest-control|fumigation-bachon|ghar-ko-fumigation|fumigation-machine/, 'general fumigation'],
    [/termite|deemak/, 'termite treatment'],
    [/bed-bug|khatmal/, 'bed bug (khatmal) treatment'],
    [/rodent/, 'rodent control'],
    [/mosquito|dengue/, 'mosquito and dengue spray'],
    [/cockroach/, 'cockroach control'],
    [/ant-control/, 'ant control'],
    [/lizard|chipkali/, 'lizard (chipkali) control'],
    [/bee-wasp/, 'bee or wasp nest removal'],
    [/annual-pest-control/, 'the Annual Shield plan'],
    [/commercial-cleaning|office-cleaning|post-construction-cleaning|janitorial|quotation-checklist|commercial-kitchen/, 'a cleaning quotation for my premises'],
    [/commercial|contract/, 'commercial pest control'],
    [/price-list|^\/book/, 'a pest control quote']
  ];
  var CAPS = { dha: 'DHA', pechs: 'PECHS' };
  function areaOf(path) {
    var m = /pest-control-(.+?)-karachi/.exec(path);
    if (!m || m[1] === 'price-list' || m[1] === 'contract') return '';
    if (m[1] === 'north') return 'North Karachi';
    return m[1].split('-').map(function (w) {
      if (CAPS[w]) return CAPS[w];
      return w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase();
    }).join(' ').replace(/ E /g, '-e-');
  }
  function messageFor(path) {
    for (var c = 0; c < COMMERCIAL_BY_PATH.length; c++) {
      if (COMMERCIAL_BY_PATH[c][0].test(path)) return 'Hi SafaiKaro, ' + COMMERCIAL_BY_PATH[c][1] + ' site survey: I need ' + COMMERCIAL_BY_PATH[c][2] + ' in Karachi.';
    }
    var area = areaOf(path);
    if (area) return 'Hi SafaiKaro, I need pest control in ' + area + (/Karachi$/.test(area) ? '.' : ', Karachi.');
    for (var i = 0; i < SERVICE_BY_PATH.length; i++) {
      if (SERVICE_BY_PATH[i][0].test(path)) return 'Hi SafaiKaro, I need ' + SERVICE_BY_PATH[i][1] + ' in Karachi.';
    }
    return 'Hi SafaiKaro, I need pest control in Karachi.';
  }
  return { messageFor: messageFor };
})();

(function () {
  if (typeof document === 'undefined') return;
  function prefillFooter() {
    var path = location.pathname.replace(/\.html$/, '');
    var links = document.querySelectorAll('footer a[href*="wa.me"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (/[?&]text=/.test(href)) continue;
      var text = SK_PREFILL.messageFor(path);
      links[i].setAttribute('href', href.split('#')[0] + (href.indexOf('?') === -1 ? '?' : '&') + 'text=' + encodeURIComponent(text));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prefillFooter);
  else prefillFooter();
})();

(function () {
  if (typeof document === 'undefined') return;

  // First page of the session, kept in sessionStorage so a /book handoff keeps its commercial origin.
  function entryOf() {
    try {
      var v = sessionStorage.getItem('sk_entry');
      if (v) {
        var o = JSON.parse(v);
        if (o && o.c) return o;
      }
      var c = skClassify(location.pathname);
      var e = { c: c[0], s: c[1] };
      sessionStorage.setItem('sk_entry', JSON.stringify(e));
      return e;
    } catch (_) {
      var k = skClassify(location.pathname);
      return { c: k[0], s: k[1] };
    }
  }
  var ENTRY = entryOf();

  function ph(event, props, urgent) {
    if (!window.posthog || typeof posthog.capture !== 'function') return;
    props.path = location.pathname;
    var pc = skClassify(location.pathname);
    props.page_class = pc[0];
    props.page_segment = pc[1];
    props.entry_class = ENTRY.c;
    props.entry_segment = ENTRY.s;
    try {
      posthog.capture(event, props, urgent ? { transport: 'sendBeacon', send_instantly: true } : undefined);
    } catch (_) {
      posthog.capture(event, props); // fallback: never let tracking throw into the click path
    }
  }

  // Placement, most specific first. Order matters: the float sits inside <body>
  // not a section; the desktop card is injected at body level too.
  var PLACEMENTS = [
    ['[data-cta]', function (el) { return el.getAttribute('data-cta'); }],
    ['#wa-desk-card', 'desktop-card'],
    ['.wa-float', 'float'],
    ['.mobile-bar, .mobile-price-sticky', 'sticky'],
    ['nav, header', 'nav'],
    ['footer', 'footer'],
    ['.hero, .cert-hero, .price-hero, [class*="hero"]', 'hero'],
    ['.faq-item', 'faq'],
    ['.price-finder, .price-table, .price-panel, [class*="price"]', 'price-row'],
    ['article', 'article']
  ];
  function placementOf(a) {
    for (var i = 0; i < PLACEMENTS.length; i++) {
      var hit = a.closest(PLACEMENTS[i][0]);
      if (hit) { var v = PLACEMENTS[i][1]; return typeof v === 'function' ? v(hit) : v; }
    }
    return 'inline';
  }
  function sectionOf(a) {
    // A starting-price card names its own service; the group heading above it does not.
    var card = a.closest('.start-card');
    if (card) { var ch = card.querySelector('h3'); if (ch) return (ch.textContent || '').trim().slice(0, 50); }
    var sec = a.closest('section[id], section');
    if (!sec) return '';
    if (sec.id) return sec.id;
    var h = sec.querySelector('h2, h3');
    return h ? (h.textContent || '').trim().slice(0, 50) : (sec.className || '').split(' ')[0];
  }
  function prefillOf(href) {
    var m = /[?&]text=([^&]*)/.exec(href);
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')).replace(/^Hi SafaiKaro[,!]?\s*/i, '').slice(0, 80); }
    catch (_) { return ''; }
  }

  // Short page/placement key, e.g. home/sticky, rodent-control/hero,
  // blog-khatmal-ka-ilaj/article. Event-only: the founder ruled out putting
  // it in the customer's WhatsApp message (2026-09-06).
  function refOf(a) {
    var seg = location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    var page = seg.length ? seg[seg.length - 1].replace(/\.html$/, '').replace(/-karachi$/, '') : 'home';
    if (seg[0] === 'blog' && seg.length > 1) page = 'blog-' + page;
    return page + '/' + placementOf(a);
  }

  // One tap can arrive as two or three click events a few ms apart (touch +
  // synthetic click, or a nested element bubbling twice): the same href within
  // a second is counted once, so lead_events stops overstating lead_persons.
  var lastClick = { href: '', at: 0 };

  // A WhatsApp tap normally takes the page to the background (the app or a
  // new tab opens). If the page is still visible four seconds later, the tap
  // most likely did not open a conversation (blocked popup, wa.me not
  // installed, a mis-tap), so repeat taps on the same page can be read as
  // retries rather than as separate contacts.
  function watchUnconfirmedOpen(cta) {
    if (typeof document.visibilityState === 'undefined') return;
    var start = Date.now();
    var wentHidden = false;
    function onHide() { if (document.visibilityState !== 'visible') wentHidden = true; }
    function onPageHide() { wentHidden = true; }
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    setTimeout(function () {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      // A late wake-up means the browser suspended the page (it was in the
      // background, so WhatsApp did open); only a page that stayed visible the
      // whole time counts as unconfirmed.
      if (!wentHidden && document.visibilityState === 'visible' && Date.now() - start < 6000) {
        var ua = navigator.userAgent || '';
        var m = /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)/.exec(ua);
        ph('whatsapp_open_unconfirmed', { cta: cta, in_app: m ? m[0] : '' });
      }
    }, 4000);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var a = t.closest('a');
    if (a) {
      var href = a.getAttribute('href') || '';
      var lower = href.toLowerCase();
      // "Forward to your owner" share links (data-share, or wa.me with no number) open the visitor's own contacts.
      // Counted as share_click, never as a lead, and checked before the WhatsApp lead branch.
      if (a.hasAttribute('data-share') || /wa\.me\/\?text=/i.test(href)) {
        ph('share_click', { cta: placementOf(a), section: sectionOf(a), href: href.split('?')[0] }, true);
        return;
      }
      var event = null;
      var ref = '';
      if (lower.indexOf('wa.me') !== -1 || lower.indexOf('whatsapp') !== -1) {
        // On desktop wa-desktop.js intercepts every wa.me link and opens the
        // QR card instead (it fires wa_desktop_card_open). That open is not a
        // contact: whatsapp_click fires only from the card's own WhatsApp Web
        // link, and phone_copy from its copy button, so desktop lead counts
        // mean an action, not a card impression.
        if (document.getElementById('wa-desk-card') && !a.classList.contains('wa-desk-web')) return;
        var now = Date.now();
        if (href === lastClick.href && now - lastClick.at < 1000) return;
        lastClick.href = href; lastClick.at = now;
        event = 'whatsapp_click';
        ref = refOf(a);
        watchUnconfirmedOpen(placementOf(a));
      } else if (lower.indexOf('tel:') === 0) {
        event = 'call_click';
      } else if (lower.indexOf('mailto:') === 0) {
        // Procurement buyers email RFQs; a lead event like a call. The query string (subject, body) is dropped.
        event = 'email_click';
      } else if (href === '/book' || href.indexOf('/book') === 0 || /\/book(\/|\?|#|$)/.test(href)) {
        // matches /book, /book/, /book?..., and absolute https://safaikaro.pk/book
        event = 'book_click';
      }
      if (!event) return;
      // Prepared survey links can contain customer site notes. Count the CTA
      // without copying those notes into event properties.
      var privateCTA = a.getAttribute('data-private-cta') === 'true';
      ph(event, {
        text: ((a.textContent || '').trim() || a.getAttribute('aria-label') || '').slice(0, 60),
        href: (privateCTA || event === 'email_click') ? href.split('?')[0] : href,
        cta: placementOf(a),
        section: sectionOf(a),
        prefill: event === 'whatsapp_click' && !privateCTA ? prefillOf(href) : '',
        ref: ref
      }, true);
      return;
    }

    var faq = t.closest('.faq-q');
    if (faq && faq.getAttribute('aria-expanded') !== 'true') {
      // Some pages use a text chevron (U+2304) in the button; strip it and collapse whitespace so one
      // question is one value across pages.
      ph('faq_open', { question: (faq.textContent || '').replace(/[\u2304\u2303\u25BE\u25BC\u2228]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) });
      return;
    }
    var tab = t.closest('.price-tab');
    if (tab && !tab.classList.contains('active')) {
      ph('price_tab_change', { tab: tab.dataset.tab || (tab.textContent || '').trim().slice(0, 40) });
      return;
    }
    var burger = t.closest('.hamburger');
    if (burger && burger.getAttribute('aria-expanded') !== 'true') {
      ph('nav_menu_open', {});
    }
  }, true);
})();
