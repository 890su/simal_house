document.documentElement.classList.add('js');

const track = (event, data = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
};

const store = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* storage blocked */ } },
};

// UTM and click ids survive navigation between the three pages
(() => {
  const params = new URLSearchParams(location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
    if (params.get(key)) store.set(key, params.get(key));
  }
})();
const attribution = () => {
  const out = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
    const value = store.get(key);
    if (value) out[key] = value;
  }
  return out;
};

// Route strip draws once it is on screen
const routes = document.querySelectorAll('.route');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-drawn'); io.unobserve(entry.target); }
    }
  }, { threshold: 0.4 });
  routes.forEach((route) => io.observe(route));
} else {
  routes.forEach((route) => route.classList.add('is-drawn'));
}

// Typing your village writes it at the end of the route
const routePlace = document.querySelector('[data-route-place]');
if (routePlace) {
  const fallback = routePlace.textContent;
  for (const input of document.querySelectorAll('input[name="place"]')) {
    input.addEventListener('input', () => {
      const value = input.value.trim();
      routePlace.textContent = value ? value.slice(0, 32) : fallback;
    });
  }
}

// Kit diagram: list items highlight their layer
const cut = document.querySelector('.section-cut');
if (cut) {
  for (const item of document.querySelectorAll('[data-layer]')) {
    const part = cut.querySelector(`[data-part="${item.dataset.layer}"]`);
    const on = () => { cut.classList.add('is-focus'); part?.classList.add('is-hot'); item.classList.add('is-hot'); };
    const off = () => { cut.classList.remove('is-focus'); part?.classList.remove('is-hot'); item.classList.remove('is-hot'); };
    item.tabIndex = 0;
    item.addEventListener('mouseenter', on);
    item.addEventListener('mouseleave', off);
    item.addEventListener('focus', on);
    item.addEventListener('blur', off);
  }
}

// Estimator: known lines in GEL, the rest marked "quoted"
const estimator = document.querySelector('[data-estimator]');
const fullForm = document.querySelector('.lead-form.full');
if (estimator) {
  const fmt = new Intl.NumberFormat(estimator.dataset.locale, { maximumFractionDigits: 0 });
  const money = (n) => `${fmt.format(Math.round(n / 50) * 50).replace(/ | /g, ' ')} ${estimator.dataset.gel}`;
  const [lo, hi] = estimator.dataset.pct.split(',').map(Number);
  const kitOut = estimator.querySelector('[data-kit]');
  const asmOut = estimator.querySelector('[data-assembly]');
  const totalOut = estimator.querySelector('[data-total]');
  const list = estimator.querySelector('[data-tally-list]');
  const update = () => {
    const picked = estimator.querySelector('input[name="model"]:checked');
    const price = Number(picked?.dataset.price) || 0;
    const assembly = estimator.elements.namedItem('assembly').checked;
    kitOut.textContent = price ? money(price) : estimator.dataset.onRequest;
    asmOut.textContent = price ? `${money(price * lo / 100)} – ${money(price * hi / 100)}` : `${lo}–${hi}%`;
    totalOut.hidden = !price;
    totalOut.textContent = price ? (assembly ? `${money(price * (1 + lo / 100))} – ${money(price * (1 + hi / 100))}` : money(price)) : '';
    const rows = [[`${estimator.dataset.kitLabel} · ${picked?.closest('label').querySelector('b').textContent || ''}`, kitOut.textContent]];
    for (const line of estimator.querySelectorAll('label.line')) {
      const box = line.querySelector('input');
      if (!box.checked) continue;
      rows.push([line.querySelector('b').textContent, line.querySelector('output')?.textContent || estimator.dataset.byCalc]);
    }
    list.replaceChildren(...rows.map(([name, value]) => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = name;
      const b = document.createElement('b'); b.textContent = value;
      li.append(a, b);
      return li;
    }));
  };
  estimator.addEventListener('change', update);
  update();

  for (const link of document.querySelectorAll('[data-pick-model]')) {
    link.addEventListener('click', () => {
      const radio = estimator.querySelector(`input[name="model"][value="${link.dataset.pickModel}"]`);
      if (radio) { radio.checked = true; update(); }
      track('view_model', { model: link.dataset.pickModel });
    });
  }

  estimator.querySelector('[data-estimate-send]')?.addEventListener('click', () => {
    const model = estimator.querySelector('input[name="model"]:checked')?.value || '';
    const picked = [];
    for (const line of estimator.querySelectorAll('label.line')) {
      const box = line.querySelector('input');
      if (box.checked) picked.push(line.querySelector('b').textContent);
    }
    if (fullForm) {
      const modelSelect = fullForm.elements.namedItem('model');
      if (modelSelect) modelSelect.value = model;
      const extras = fullForm.elements.namedItem('extras');
      if (extras) extras.value = picked.join(', ');
    }
    track('quote_start', { model });
    goToRequest();
  });
}

function goToRequest() {
  const section = document.querySelector('#request');
  if (!section) return;
  section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => {
    const target = section.querySelector('input:not([type=hidden]),select,textarea');
    target?.focus({ preventScroll: true });
  }, 450);
}

// CTA links carry an intent into the request form
for (const link of document.querySelectorAll('[data-intent]')) {
  link.addEventListener('click', () => {
    if (!fullForm) return;
    fullForm.elements.namedItem('intent').value = link.dataset.intent;
    const comment = fullForm.elements.namedItem('comment');
    if (comment && !comment.value) comment.value = link.textContent.trim();
    track('intent', { intent: link.dataset.intent });
  });
}
for (const el of document.querySelectorAll('[data-event]')) {
  el.addEventListener('click', () => track(el.dataset.event));
}

// Payback calculator (hospitality)
const payback = document.querySelector('[data-payback]');
if (payback) {
  const fmt = new Intl.NumberFormat(payback.dataset.locale, { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat(payback.dataset.locale, { maximumFractionDigits: 1 });
  const clean = (s) => s.replace(/ | /g, ' ');
  const val = (name) => Number(payback.elements.namedItem(name).value) || 0;
  const update = () => {
    const income = val('rate') * val('nights') * (1 - Math.min(val('costs'), 95) / 100);
    payback.querySelector('[data-income]').textContent = income > 0 ? `${clean(fmt.format(income))} GEL` : '—';
    const invest = val('invest');
    payback.querySelector('[data-payback-years]').textContent = invest > 0 && income > 0 ? `${clean(fmt1.format(invest / income))}${payback.dataset.years ? ` ${payback.dataset.years}` : ''}` : '—';
  };
  payback.addEventListener('input', update);
  update();
}

// Lead forms: endpoint → WhatsApp → demo
for (const form of document.querySelectorAll('[data-form]')) {
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type=submit]');
  const say = (text, kind = '') => { status.textContent = text; status.className = `status${kind ? ` is-${kind}` : ''}`; };
  const fieldError = (input, message) => {
    const err = form.querySelector(`#${input.id}-err`);
    if (message) { input.setAttribute('aria-invalid', 'true'); if (err) { err.textContent = message; err.hidden = false; } }
    else { input.removeAttribute('aria-invalid'); if (err) { err.textContent = ''; err.hidden = true; } }
  };
  for (const input of form.querySelectorAll('[required]')) input.addEventListener('input', () => fieldError(input, ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    let firstBad = null;
    for (const input of form.querySelectorAll('[required]')) {
      const value = input.value.trim();
      const bad = !value || (input.type === 'tel' && value.replace(/\D/g, '').length < 7);
      fieldError(input, bad ? input.dataset.msg : '');
      if (bad && !firstBad) firstBad = input;
    }
    if (firstBad) { firstBad.focus(); return; }

    const data = { page: form.dataset.page, lang: form.dataset.lang, form: form.dataset.form, url: location.href, ...attribution() };
    const lines = [];
    for (const el of form.querySelectorAll('input,select,textarea')) {
      const value = el.value.trim();
      if (!el.name || !value) continue;
      data[el.name] = value;
      if (el.type === 'hidden') continue;
      const label = form.querySelector(`label[for="${el.id}"] span`)?.textContent || el.name;
      lines.push(`${label}: ${value}`);
    }
    track('quote_submit', { page: data.page, form: data.form, model: data.model || '' });

    const endpoint = form.dataset.endpoint;
    const wa = form.dataset.wa;
    if (endpoint) {
      button.setAttribute('aria-busy', 'true');
      say(form.dataset.sending);
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        say(form.dataset.success);
        track('lead', { page: data.page });
      } catch {
        say(form.dataset.error, 'error');
      } finally {
        button.removeAttribute('aria-busy');
      }
      return;
    }
    if (wa) {
      const text = `${document.title}\n\n${lines.join('\n')}`;
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      say(form.dataset.waOpened);
      return;
    }
    say(form.dataset.demo, 'warn');
  });
}

// Mobile dock hides while the request form is on screen
const dock = document.querySelector('[data-dock]');
const request = document.querySelector('#request');
if (dock && request && 'IntersectionObserver' in window) {
  const hero = document.querySelector('.hero');
  let inRequest = false; let inHero = true;
  const sync = () => dock.classList.toggle('is-hidden', inRequest || inHero);
  new IntersectionObserver(([e]) => { inRequest = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(request);
  if (hero) new IntersectionObserver(([e]) => { inHero = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(hero);
  sync();
}

// Language links keep the current section
for (const link of document.querySelectorAll('.langs a')) {
  link.addEventListener('click', () => { if (location.hash) link.hash = location.hash; });
}

// header menu under 1100px: close on choice, outside click, Escape
document.querySelectorAll(".navdrop").forEach((d) => {
  d.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { d.open = false; }));
  document.addEventListener("click", (e) => { if (d.open && !d.contains(e.target)) d.open = false; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && d.open) { d.open = false; d.querySelector("summary").focus(); } });
});

