/* Progressive enhancement only: all service content and contact links work without JS. */
(function () {
  'use strict';
  var toggle = document.querySelector('.sk-menu-toggle');
  var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('sk-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('sk-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('sk-open')) { closeMenu(); toggle.focus(); }
    });
  }
  document.querySelectorAll('form.sk-survey').forEach(function (form) {
    var link = form.querySelector('[data-survey-link]');
    var status = form.querySelector('[data-survey-status]');
    if (!link || !status) return;
    form.addEventListener('input', function () {
      link.hidden = true;
      status.textContent = '';
    });
    form.addEventListener('change', function () { link.hidden = true; status.textContent = ''; });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      function value(name) { return String(data.get(name) || '').trim(); }
      if (!value('area') || !value('scope')) {
        status.textContent = 'Add your broad area and the work you need before preparing your request.';
        return;
      }
      var number = (form.dataset.whatsapp || '923308652035').replace(/\D/g, '');
      var message = 'Hi SafaiKaro, I would like a ' + (form.dataset.service || 'commercial service') + ' quote in Karachi.';
      message += '\nSite type: ' + value('site_type') + '\nBroad area: ' + value('area');
      message += '\nScope: ' + value('scope') + '\nPreferred access window: ' + value('timing');
      message += '\nPlease confirm the survey or quotation next step.';
      link.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
      link.hidden = false;
      status.textContent = 'Your request is ready. Open WhatsApp to review and send it. Nothing has been sent yet.';
      link.focus();
      // Do not send form contents or a generated URL to analytics.
      if (window.posthog && typeof window.posthog.capture === 'function') {
        try { window.posthog.capture('commercial_survey_prepared', {path: location.pathname, service: form.dataset.service || 'commercial'}); } catch (_) {}
      }
    });
    form.hidden = false;
  });
})();
