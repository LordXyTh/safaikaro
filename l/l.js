/* SafaiKaro landing-page tracking. Loaded after the PostHog snippet and prices.js.
 *
 * prices.js already captures one whatsapp_click per tap, sitewide. This file does
 * not capture a second one: on a WhatsApp tap it stamps event_id and page=landing
 * onto that same event (window capture phase runs before prices.js's document
 * listener), and sends the pixel Lead with the same event_id so CAPI can dedupe.
 * The CTA href works without this file; JS only decorates it with the ref code.
 */
(function () {
  var META_PIXEL_ID = "REPLACE_ME"; // set once Task 3 reports the pixel id
  var WA = "https://wa.me/923308652035";
  var body = document.body;
  var segment = body.getAttribute("data-segment") || "unknown";
  var letter = body.getAttribute("data-segment-letter") || "X";
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  function mint() {
    var s = "";
    for (var i = 0; i < 4; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    return "SK-" + letter + s;
  }
  var memo = null; // fallback when sessionStorage is blocked: stable for this page view
  function refCode() {
    try {
      var k = "sk_ref_" + segment, v = sessionStorage.getItem(k);
      if (!v) { v = mint(); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) { return memo || (memo = mint()); }
  }
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  // Meta pixel base (only if an id is set)
  if (META_PIXEL_ID !== "REPLACE_ME") {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID); fbq('track', 'PageView');
  }
  var ref = refCode();
  try {
    if (window.posthog && posthog.register) {
      posthog.register({ landing_segment: segment, ref_code: ref });
      if (posthog.setPersonProperties) posthog.setPersonProperties({ ref_code: ref, landing_segment: segment });
    }
  } catch (e) { /* tracking must never break the page */ }

  // Decorate every WhatsApp CTA with the ref code; the href already works without JS.
  var ctas = document.querySelectorAll('a[href^="' + WA + '"]');
  for (var i = 0; i < ctas.length; i++) {
    var a = ctas[i];
    var base = a.getAttribute("href").split("?")[0];
    var text = a.getAttribute("data-prefill") || "Hi SafaiKaro";
    a.setAttribute("href", base + "?text=" + encodeURIComponent(text + ", Ref " + ref));
  }

  // One tap can arrive as two click events a few ms apart; prices.js counts the
  // same href once per second, so the pixel Lead follows the same rule.
  var last = { href: "", at: 0 };
  function onTap(e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href^="' + WA + '"]') : null;
    if (!a) return;
    var href = a.getAttribute("href"), now = Date.now();
    if (href === last.href && now - last.at < 1000) return;
    last.href = href; last.at = now;
    var id = uuid();
    try {
      if (window.posthog && posthog.register) {
        // Picked up by the whatsapp_click prices.js captures for this same tap.
        posthog.register({ event_id: id, page: "landing" });
        setTimeout(function () {
          try { posthog.unregister("event_id"); posthog.unregister("page"); } catch (e2) {}
        }, 0);
      }
    } catch (e1) {}
    try {
      if (window.fbq) fbq("track", "Lead", { content_name: segment, content_category: "pest-control" }, { eventID: id });
    } catch (e3) {}
    SK_L.lastEventId = id;
  }
  window.addEventListener("click", onTap, true);

  // FAQ accordion (same behaviour as the main site).
  var qs = document.querySelectorAll(".faq-q");
  for (var j = 0; j < qs.length; j++) {
    qs[j].addEventListener("click", function () {
      var item = this.closest(".faq-item"), wasOpen = item.classList.contains("open");
      var open = document.querySelectorAll(".faq-item.open");
      for (var k = 0; k < open.length; k++) {
        open[k].classList.remove("open");
        open[k].querySelector(".faq-q").setAttribute("aria-expanded", "false");
      }
      if (!wasOpen) { item.classList.add("open"); this.setAttribute("aria-expanded", "true"); }
    });
  }

  var SK_L = window.SK_L = { refCode: refCode, pixelId: META_PIXEL_ID, segment: segment, lastEventId: null };
})();
