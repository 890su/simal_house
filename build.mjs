import { mkdir, writeFile } from 'node:fs/promises';
import { copy } from './copy.mjs';
import { site, models, naina66, catalogUrl } from './site.config.mjs';

const dist = new URL('./dist/', import.meta.url);
const pages = { garden: 'index.html', business: 'hospitality.html', property: 'property.html' };
const langs = ['ka', 'ru', 'en'];
const locale = { ka: 'ka-GE', ru: 'ru-RU', en: 'en-GB' };
const ogLocale = { ka: 'ka_GE', ru: 'ru_RU', en: 'en_GB' };
const langShort = { ka: 'ქარ', ru: 'Рус', en: 'Eng' };
const langName = { ka: 'ქართული', ru: 'Русский', en: 'English' };

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const fill = (s) => String(s)
  .replaceAll('{from}', new Intl.NumberFormat('ru-RU').format(site.priceFrom))
  .replaceAll('{pct}', `${site.assemblyPct[0]}–${site.assemblyPct[1]}`)
  .replaceAll('{months}', site.productionMonths);

// ---------- icons (one stroke family, 1.75) ----------
const svg = (body, size = 20, extra = '') => `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"${extra}>${body}</svg>`;
const icon = {
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 18),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>', 18),
  pin: svg('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>', 20),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>', 18),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>', 20),
  truck: svg('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>', 22),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/>', 22),
  crane: svg('<path d="M4 20V5l14 3M4 5l5 15M18 8v5M15.5 13h5v3h-5z"/><path d="M2 20h20"/>', 22),
  whatsapp: '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.5-.3Z"/></svg>',
  telegram: '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.4 4.3 18.3 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.2.2-.5.4-1 .4l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2L6.2 12.8l-4.6-1.4c-1-.3-1-1 .2-1.5l18-6.9c.9-.3 1.6.2 1.6 1.3Z"/></svg>',
};
const logomark = `<svg aria-hidden="true" viewBox="0 0 40 40" width="34" height="34"><path d="M20 37s12-10.4 12-19.5a12 12 0 0 0-24 0C8 26.6 20 37 20 37Z" fill="var(--red)"/><path d="M13.5 20.5 20 14.5l6.5 6v6h-13z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M18 26.5v-3.5h4v3.5" fill="none" stroke="#fff" stroke-width="2"/></svg>`;

// ---------- helpers ----------
function numberFmt(lang) {
  const n = new Intl.NumberFormat(locale[lang], { maximumFractionDigits: 1 });
  return (v) => n.format(v).replace(/ | /g, ' ');
}
const total = (m) => m.rooms.reduce((sum, [k, a]) => (k === 'terrace' ? sum : sum + a), 0);
const plural = (n, forms) => forms[n === 1 ? 0 : n < 5 ? 1 : 2];

function pageHref(fromLang, toLang, page) {
  const prefix = fromLang === 'ka' ? (toLang === 'ka' ? '' : `${toLang}/`) : (toLang === 'ka' ? '../' : toLang === fromLang ? '' : `../${toLang}/`);
  const file = pages[page] === 'index.html' ? '' : pages[page];
  const out = `${prefix}${file}`;
  return out || './';
}
function absolute(lang, page) {
  if (!site.baseUrl) return '';
  const file = pages[page] === 'index.html' ? '' : pages[page];
  return `${site.baseUrl}/${lang === 'ka' ? '' : `${lang}/`}${file}`;
}

function contactHref(kind) {
  if (kind === 'whatsapp' && site.whatsapp) return `https://wa.me/${site.whatsapp}`;
  if (kind === 'telegram' && site.telegram) return `https://t.me/${site.telegram}`;
  if (kind === 'phone' && site.phone) return `tel:${site.phone.replace(/[^+\d]/g, '')}`;
  return '#request';
}
const external = (href) => (href.startsWith('http') ? ' target="_blank" rel="noopener"' : '');

function picture(asset, id, alt, { priority = false, sizes = '(max-width: 760px) 100vw, 58vw' } = {}) {
  return `<picture><source type="image/avif" srcset="${asset}${id}-scene-small.avif 760w, ${asset}${id}-scene.avif 1500w" sizes="${sizes}"><img src="${asset}${id}-scene.webp" srcset="${asset}${id}-scene-small.webp 760w, ${asset}${id}-scene.webp 1500w" sizes="${sizes}" alt="${esc(alt)}" width="1500" height="1000" ${priority ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}></picture>`;
}

// ---------- floor plan drawn from data ----------
function plan(m, c, lang) {
  const f = numberFmt(lang);
  const S = 60; // px per metre
  const pad = 34;
  const W = m.w * S; const D = m.d * S;
  const terrace = m.rooms.find(([k]) => k === 'terrace');
  const bath = m.rooms.find(([k]) => k === 'bath');
  const room = m.rooms.find(([k]) => k === 'room');
  const tDepth = terrace ? 1.2 * S : 0;
  const rx = pad; const ry = pad; const rw = W; const rh = D - tDepth;
  let inner = `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" class="pl-wall"/>`;
  let labels = '';
  if (bath) {
    const bw = (bath[1] > 3 ? 1.8 : 1.6) * S; const bd = (bath[1] / (bw / S)) * S;
    inner += `<rect x="${rx + rw - bw}" y="${ry}" width="${bw}" height="${bd}" class="pl-part pl-wet"/>`;
    labels += `<text x="${rx + rw - bw / 2}" y="${ry + bd / 2 + 5}" class="pl-a pl-sm">${f(bath[1])}</text>`;
    labels += `<text x="${rx + (rw - bw) / 2}" y="${ry + rh / 2 + 4}" class="pl-a">${f(room[1])} ${c.units.m2}</text>`;
  } else {
    labels += `<text x="${rx + rw / 2}" y="${ry + rh / 2 + 8}" class="pl-a">${f(room[1])} ${c.units.m2}</text>`;
  }
  // door + windows (indicative)
  inner += `<line x1="${rx + rw * 0.62}" y1="${ry + rh}" x2="${rx + rw * 0.82}" y2="${ry + rh}" class="pl-gap"/>`;
  inner += `<line x1="${rx + rw * 0.15}" y1="${ry + rh}" x2="${rx + rw * 0.4}" y2="${ry + rh}" class="pl-win"/>`;
  if (!terrace) inner += `<line x1="${rx + rw}" y1="${ry + rh * 0.45}" x2="${rx + rw}" y2="${ry + rh * 0.8}" class="pl-win"/>`;
  if (terrace) {
    inner += `<rect x="${rx}" y="${ry + rh}" width="${rw}" height="${tDepth}" class="pl-terrace"/>`;
    labels += `<text x="${rx + rw / 2}" y="${ry + rh + tDepth / 2 + 5}" class="pl-a pl-sm">${c.rooms.terrace} ${f(terrace[1])}</text>`;
  }
  const dims = `<text x="${rx + rw / 2}" y="${pad - 12}" class="pl-dim">${f(m.w)} ${c.units.m}</text><text x="${pad - 12}" y="${ry + D / 2}" class="pl-dim" transform="rotate(-90 ${pad - 12} ${ry + D / 2})">${f(m.d)} ${c.units.m}</text>`;
  const ticks = `<path d="M${rx} ${pad - 6}v-6M${rx + rw} ${pad - 6}v-6M${rx} ${pad - 9}h${rw}M${pad - 6} ${ry}h-6M${pad - 6} ${ry + D}h-6M${pad - 9} ${ry}v${D}" class="pl-tick"/>`;
  return `<svg class="plan" viewBox="0 0 ${W + pad * 2} ${D + pad * 2}" role="img" aria-label="${esc(`${c.models[m.id].name}: ${m.rooms.map(([k, a]) => `${c.rooms[k]} ${f(a)} ${c.units.m2}`).join(', ')}`)}">${ticks}${dims}${inner}${labels}</svg>`;
}

function specList(m, c, lang, { withPrice = true } = {}) {
  const f = numberFmt(lang);
  const rooms = m.rooms.map(([k, a]) => `${c.rooms[k]} ${f(a)}`).join(' · ');
  const rows = [
    [c.spec.footprint, `${f(m.w)} × ${f(m.d)} ${c.units.m}`],
    [c.spec.inside, `${f(total(m))} ${c.units.m2}`, rooms],
    [c.spec.wall, c.spec.wallValue.replace('{mm}', m.wall)],
  ];
  if (m.packs) rows.push([c.spec.packs, `${m.packs} × ${f(m.packLen)} ${c.units.m}`, `≈ ${f(m.weight / 1000)} ${c.spec.weight}`]);
  if (withPrice) {
    rows.push([c.spec.price, m.price ? `${f(m.price)} ${c.units.gel}` : c.spec.onRequest]);
    rows.push([c.spec.lead, m.stock ? c.spec.inStock : fill(c.spec.leadValue)]);
  }
  return `<dl class="spec">${rows.map(([k, v, sub]) => `<div><dt>${k}</dt><dd>${v}${sub ? `<small>${sub}</small>` : ''}</dd></div>`).join('')}</dl>`;
}

// ---------- shared blocks ----------
function header(c, lang, page) {
  const home = page === 'garden' ? '' : pageHref(lang, lang, 'garden');
  const nav = [[`${home}#models`, c.nav.models], [`${home}#price`, c.nav.price], [`${home}#delivery`, c.nav.delivery], [pageHref(lang, lang, 'business'), c.nav.business, page === 'business'], [pageHref(lang, lang, 'property'), c.nav.property, page === 'property']];
  const navLinks = nav.map(([href, label, current]) => `<a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const wa = contactHref('whatsapp');
  return `<header class="top"><div class="wrap top-in">
    <a class="brand" href="${pageHref(lang, lang, 'garden')}">${logomark}<span>${c.brand}</span></a>
    <nav class="menu" aria-label="${c.navLabel}">${navLinks}</nav>
    <div class="top-act">
      <nav class="langs" aria-label="${c.langLabel}">${langs.map((l) => `<a href="${pageHref(lang, l, page)}" lang="${l}" hreflang="${l}" title="${langName[l]}"${l === lang ? ' aria-current="true"' : ''}>${langShort[l]}</a>`).join('')}</nav>
      <details class="navdrop"><summary aria-label="${c.menuLabel}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg><span>${c.menuLabel}</span></summary><nav aria-label="${c.navLabel}">${navLinks}</nav></details>
      <a class="btn btn-line btn-wa" href="${wa}"${external(wa)} data-event="contact_whatsapp">${icon.whatsapp}<span>${c.whatsapp}</span></a>
    </div>
  </div></header>`;
}

function routeStrip(items, { place = '', cls = '' } = {}) {
  return `<div class="route ${cls}"><svg class="route-line" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 1000 12"><line x1="0" y1="6" x2="1000" y2="6" class="road"/><line x1="0" y1="6" x2="1000" y2="6" class="trace"/></svg>
    <ol>${items.map(([title, text], i) => {
      const last = i === items.length - 1;
      return `<li${last ? ' class="dest"' : ''}><span class="post" aria-hidden="true">${last && place ? icon.pin : i + 1}</span><b${last && place ? ' data-route-place' : ''}>${fill(title)}</b><span>${fill(text)}</span></li>`;
    }).join('')}</ol></div>`;
}

function faq(c, items) {
  return `<section class="faq section" id="faq" aria-labelledby="faq-title"><div class="wrap faq-grid"><h2 id="faq-title">${c.faqTitle}</h2><div class="faq-list">${items.map(([q, a]) => `<details><summary><span>${fill(q)}</span><i aria-hidden="true"></i></summary><p>${fill(a)}</p></details>`).join('')}</div></div></section>`;
}

function field(name, label, control, { required = false, optional = '', wide = false } = {}) {
  return `<div class="field${wide ? ' wide' : ''}"><label for="${name}"><span>${label}</span>${!required && optional ? `<small>${optional}</small>` : ''}</label>${control}<small class="err" id="${name}-err" hidden></small></div>`;
}
const input = (id, name, { type = 'text', hint = '', req = '', auto = '', mode = '', value = '' } = {}) => `<input id="${id}" name="${name}" type="${type}"${hint ? ` placeholder="${esc(hint)}"` : ''}${req ? ` required data-msg="${esc(req)}" aria-describedby="${id}-err"` : ''}${auto ? ` autocomplete="${auto}"` : ''}${mode ? ` inputmode="${mode}"` : ''}${value ? ` value="${esc(value)}"` : ''} maxlength="120">`;
const select = (id, name, options) => `<select id="${id}" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}">${l}</option>`).join('')}</select>`;

function requestSection(c, lang, page, t) {
  const F = c.form;
  const p = (s) => `r-${s}`;
  const sets = {
    garden: [
      field(p('phone'), F.phone, input(p('phone'), 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
      field(p('place'), F.place, input(p('place'), 'place', { hint: F.placeHint, req: F.required.place, auto: 'address-level2' }), { required: true }),
      field(p('model'), F.model, select(p('model'), 'model', [['', F.modelHelp], ...models.map((m) => [m.id, c.models[m.id].name])])),
      field(p('when'), F.when, select(p('when'), 'when', F.whenOptions.map((o) => [o, o]))),
      field(p('name'), F.name, input(p('name'), 'name', { auto: 'given-name' }), { optional: F.optional }),
      field(p('extras'), F.extras, input(p('extras'), 'extras'), { optional: F.optional }),
      field(p('comment'), F.comment, `<textarea id="${p('comment')}" name="comment" rows="3" maxlength="1000"></textarea>`, { optional: F.optional, wide: true }),
    ],
    business: [
      field(p('phone'), F.phone, input(p('phone'), 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
      field(p('site'), F.site, input(p('site'), 'site', { hint: F.siteHint, req: F.required.site }), { required: true }),
      field(p('qty'), F.qty, select(p('qty'), 'qty', F.qtyOptions.map((o) => [o, o]))),
      field(p('country'), F.country, input(p('country'), 'country', { value: F.countryValue, auto: 'country-name' })),
      field(p('company'), F.company, input(p('company'), 'company', { auto: 'organization' }), { optional: F.optional }),
      field(p('name'), F.name, input(p('name'), 'name', { auto: 'name' }), { optional: F.optional }),
      field(p('comment'), F.comment, `<textarea id="${p('comment')}" name="comment" rows="3" maxlength="1000"></textarea>`, { optional: F.optional, wide: true }),
    ],
    property: [
      field(p('phone'), F.phone, input(p('phone'), 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
      field(p('district'), F.district, select(p('district'), 'district', F.districtOptions.map((o) => [o, o]))),
      field(p('name'), F.name, input(p('name'), 'name', { auto: 'given-name' }), { optional: F.optional }),
      field(p('budget'), F.budget, input(p('budget'), 'budget', { mode: 'numeric' }), { optional: F.optional }),
    ],
  };
  return `<section class="request section" id="request" tabindex="-1" aria-labelledby="request-title"><div class="wrap request-grid">
    <div class="request-copy"><h2 id="request-title">${t.formTitle}</h2><p>${t.formLead}</p>${direct(c)}</div>
    ${formShell(c, lang, page, 'full', sets[page].join(''))}
  </div></section>`;
}

function formShell(c, lang, page, kind, fields) {
  const F = c.form;
  return `<form class="lead-form ${kind}" data-form="${kind}" data-page="${page}" data-lang="${lang}" novalidate
    data-endpoint="${esc(site.formEndpoint)}" data-wa="${esc(site.whatsapp)}" data-sending="${esc(F.sending)}" data-success="${esc(F.success)}" data-wa-opened="${esc(F.waOpened)}" data-demo="${esc(F.demo)}" data-error="${esc(F.error)}">
    <input type="hidden" name="intent" value="">
    <div class="fields">${fields}</div>
    <button class="btn" type="submit"><span>${kind === 'quick' ? c[page].heroCta : F.submit}</span>${icon.arrow}</button>
    ${kind === 'full' ? `<p class="consent">${F.consent}</p>` : ''}
    <p class="status" role="status" aria-live="polite" data-status></p>
  </form>`;
}

function direct(c) {
  const items = [['whatsapp', c.whatsapp, icon.whatsapp], ['telegram', c.telegram, icon.telegram], ['phone', site.phone || c.call, icon.phone]];
  return `<div class="direct"><p>${c.form.direct}</p><div>${items.map(([k, label, ic]) => { const h = contactHref(k); return `<a class="btn btn-line" href="${h}"${external(h)} data-event="contact_${k}">${ic}<span>${label}</span></a>`; }).join('')}</div></div>`;
}

function footer(c, lang, page) {
  return `<footer class="foot"><div class="wrap foot-grid">
    <div><a class="brand" href="${pageHref(lang, lang, 'garden')}">${logomark}<span>${c.brand}</span></a><p>${c.footer.address}</p></div>
    <nav aria-label="${c.navLabel}"><a href="${pageHref(lang, lang, 'garden')}#models">${c.nav.models}</a><a href="${pageHref(lang, lang, 'garden')}#price">${c.nav.price}</a><a href="${pageHref(lang, lang, 'garden')}#delivery">${c.nav.delivery}</a><a href="${pageHref(lang, lang, 'business')}">${c.nav.business}</a><a href="${pageHref(lang, lang, 'property')}">${c.nav.property}</a><a href="${catalogUrl}" target="_blank" rel="noopener">${c.source.replace(/,.*$/, '')}</a></nav>
    <p class="foot-note">${c.footer.note}</p>
  </div></footer>
  <div class="dock" data-dock><a class="btn" href="#request" data-event="dock_request"><span>${c[page].heroCta}</span>${icon.arrow}</a><a class="btn btn-line" href="${contactHref('whatsapp')}"${external(contactHref('whatsapp'))} aria-label="${c.whatsapp}" data-event="contact_whatsapp">${icon.whatsapp}</a></div>`;
}

function hero(c, lang, page, asset, imageId, imageAlt, figcap, quickFields, extra = '') {
  const t = c[page];
  return `<section class="hero hero-${page}" aria-labelledby="hero-title"><div class="wrap hero-grid">
    <div class="hero-copy">
      ${t.status ? `<p class="status-flag">${icon.pin}<span>${t.status}</span></p>` : ''}
      <h1 id="hero-title">${t.h1}</h1>
      <p class="lead">${fill(t.lead)}</p>
      ${formShell(c, lang, page, 'quick', quickFields)}
      <p class="fine">${t.heroNote}</p>
    </div>
    <figure class="inset">${picture(asset, imageId, imageAlt, { priority: true })}<figcaption>${figcap}</figcaption></figure>
    ${extra}
  </div></section>`;
}

// ---------- garden page ----------
function gardenPage(c, lang, asset) {
  const t = c.garden; const F = c.form; const f = numberFmt(lang);
  const quick = [
    field('q-place', F.place, input('q-place', 'place', { hint: F.placeHint, req: F.required.place, auto: 'address-level2' }), { required: true }),
    field('q-phone', F.phone, input('q-phone', 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
  ].join('');
  const priceSigns = `<dl class="signs">
    <div class="sign sign-price"><dt>${t.priceTag}</dt><dd><b>${c.units.from ? `${c.units.from} ` : ''}${f(site.priceFrom)}</b> ${c.units.gel}${lang === 'ka' ? '-დან' : ''}</dd><dd class="sign-note">${t.priceNote}</dd></div>
    <div class="sign"><dt>${t.assemblyTag}</dt><dd><b>+${site.assemblyPct[0]}–${site.assemblyPct[1]}%</b></dd><dd class="sign-note">${t.assemblyNote}</dd></div>
  </dl>`;
  const heroBlock = hero(c, lang, 'garden', asset, 'elza', `${c.models.elza.name} · ${c.render}`, `<b>${c.models.elza.name}</b><span>${f(3.8)} × ${f(4.8)} ${c.units.m} · ${f(11.3)} + ${f(4.2)} ${c.units.m2}</span><span>${c.render}</span>`, quick, priceSigns);

  const route = `<section class="route-band" aria-label="${esc(t.route.map(([a]) => fill(a)).join(' → '))}"><div class="wrap">${routeStrip(t.route, { place: t.routePlaceholder })}</div></section>`;

  const season = `<section class="season section" aria-labelledby="season-title"><div class="wrap season-grid">
    <div><h2 id="season-title">${t.season.h2}</h2><p>${fill(t.season.text)}</p></div>
    <div><ol class="months">${t.season.steps.map(([when, what], i) => `<li${i === t.season.steps.length - 1 ? ' class="goal"' : ''}><b>${when}</b><span>${what}</span></li>`).join('')}</ol><p class="fine">${t.season.note}</p></div>
  </div></section>`;

  const modelRows = models.map((m) => {
    const M = c.models[m.id];
    return `<article class="model" id="model-${m.id}" aria-labelledby="name-${m.id}">
      <figure class="model-photo">${picture(asset, m.id, `${M.name} · ${c.render}`, { sizes: '(max-width: 760px) 100vw, 40vw' })}<figcaption>${c.render}</figcaption></figure>
      <div class="model-body">
        <header><h3 id="name-${m.id}">${M.name}</h3><p class="use">${M.use}</p></header>
        <p>${M.text}</p>
        ${specList(m, c, lang)}
        <div class="model-act"><a class="btn" href="#price" data-pick-model="${m.id}" data-event="view_price_scope">${t.models.cta}${icon.arrow}</a></div>
      </div>
      <figure class="model-plan">${plan(m, c, lang)}<figcaption>${c.schematic} · <a href="${catalogUrl}#page=${m.page}" target="_blank" rel="noopener">${c.source} ${m.page}</a></figcaption></figure>
    </article>`;
  }).join('');
  const modelsBlock = `<section class="models section" id="models" aria-labelledby="models-title"><div class="wrap">
    <div class="head"><h2 id="models-title">${t.models.h2}</h2><p>${t.models.lead}</p></div>
    <div class="model-list">${modelRows}</div>
    <div class="more">
      <div><h3>${t.models.more}</h3><p>${t.models.moreText}</p><a class="btn btn-line" href="#request" data-intent="catalog" data-event="catalog_request">${t.models.moreCta}${icon.arrow}</a></div>
      <p class="fixed">${icon.info}<span>${t.models.fixed}</span></p>
    </div>
  </div></section>`;

  const K = t.kit;
  const kitBlock = `<section class="kit section" id="kit" aria-labelledby="kit-title"><div class="wrap">
    <div class="head"><h2 id="kit-title">${K.h2}</h2><p>${K.lead}</p></div>
    <div class="kit-grid">
      <figure class="section-cut">${houseSection(K.labels)}<figcaption><span class="sw sw-in"></span>${c.legend.included}<span class="sw sw-out"></span>${c.legend.separate}</figcaption></figure>
      <div class="kit-lists">
        <ol class="layers">${[['roof', 'out'], ['rafters', 'in'], ['wall', 'in'], ['window', 'in'], ['floor', 'in'], ['base', 'out']].map(([k, s], i) => `<li class="${s}" data-layer="${k}"><span class="mk">${i + 1}</span>${K.labels[k]}</li>`).join('')}</ol>
        <div class="kit-cols">
          <div><h3><span class="sw sw-in"></span>${c.legend.included}</h3><ul class="incl">${K.included.map(([h, d]) => `<li><b>${h}</b><span>${d}</span></li>`).join('')}</ul></div>
          <div><h3><span class="sw sw-out"></span>${c.legend.separate}</h3><ul class="excl">${K.separate.map((s) => `<li>${s}</li>`).join('')}</ul></div>
        </div>
      </div>
    </div>
    <div class="notes"><div class="note note-roof"><h3>${K.roofTitle}</h3><p>${K.roofText}</p></div><div class="note"><h3>${K.wallTitle}</h3><p>${K.wallText}</p></div></div>
  </div></section>`;

  const P = t.price;
  const priceBlock = `<section class="price section" id="price" aria-labelledby="price-title"><div class="wrap">
    <div class="head"><h2 id="price-title">${P.h2}</h2><p>${P.lead}</p></div>
    <form class="estimator" data-estimator data-pct="${site.assemblyPct.join(',')}" data-locale="${locale[lang]}" data-gel="${c.units.gel}" data-on-request="${esc(c.spec.onRequest)}" data-by-calc="${esc(P.byCalc)}" data-kit-label="${esc(P.kit)}" onsubmit="return false">
      <fieldset class="pick"><legend>${P.modelLabel}</legend>${models.map((m, i) => `<label><input type="radio" name="model" value="${m.id}" data-price="${m.price ?? ''}"${i === 0 ? ' checked' : ''}><span><b>${c.models[m.id].name}</b><small>${f(total(m))} ${c.units.m2}</small></span></label>`).join('')}</fieldset>
      <div class="ledger">
        <div class="line fixed-line"><span class="sw sw-in"></span><div><b>${P.kit}</b><small>${P.kitNote}</small></div><output data-kit>${c.spec.onRequest}</output></div>
        <label class="line"><input type="checkbox" name="assembly" checked data-label="${esc(P.assembly)}"><div><b>${P.assembly}</b><small>${fill(P.assemblyNote)}</small></div><output data-assembly>${site.assemblyPct[0]}–${site.assemblyPct[1]}%</output></label>
        <label class="line"><input type="checkbox" name="delivery" checked><div><b>${P.delivery}</b><small>${P.deliveryNote}</small></div><output data-delivery>${P.byAddress}</output></label>
        <p class="ledger-sub">${P.extrasTitle} <span>· ${P.byCalc}</span></p>
        <div class="extras">${P.extras.map((x) => `<label class="line extra"><input type="checkbox" name="extra" value="${esc(x)}"><div><b>${x}</b></div></label>`).join('')}</div>
      </div>
      <aside class="tally" aria-live="polite"><p>${P.total}</p><output class="tally-sum" data-total hidden></output><ul class="tally-list" data-tally-list></ul><p class="fine">${P.totalNote}</p><button class="btn" type="button" data-estimate-send data-event="quote_start">${P.cta}${icon.arrow}</button></aside>
    </form>
  </div></section>`;

  const D = t.delivery;
  const deliveryBlock = `<section class="delivery section" id="delivery" aria-labelledby="delivery-title"><div class="wrap">
    <div class="head"><h2 id="delivery-title">${D.h2}</h2></div>
    <div class="ways">${[[icon.truck, D.georgia], [icon.globe, D.abroad], [icon.crane, D.pickup]].map(([ic, [h, p]]) => `<div class="way">${ic}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
    <div class="table-wrap"><table class="packs"><thead><tr>${D.table.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${models.map((m) => `<tr><th scope="row">${c.models[m.id].name}</th><td>${m.packs} ${plural(m.packs, c.spec.pack)}</td><td>${f(m.packLen)} ${c.units.m}</td><td>≈ ${f(m.weight / 1000)} ${c.spec.weight}</td></tr>`).join('')}</tbody></table></div>
  </div></section>`;

  const sheet = `<section class="sheet section" aria-label="${esc(t.winter.h2)}"><div class="wrap sheet-grid">
    <div class="cell"><h2>${t.winter.h2}</h2><p>${t.winter.text}</p></div>
    <div class="cell"><h2>${t.uses.h2}</h2><ul class="chips">${t.uses.items.map((u) => `<li>${u}</li>`).join('')}<li><a href="${pageHref(lang, lang, 'business')}">${t.uses.business}${icon.arrow}</a></li></ul></div>
    <div class="cell cell-show"><h2>${icon.pin}${t.showroom.h2}</h2><p>${t.showroom.text}</p><a class="btn btn-line" href="#request" data-intent="showroom">${t.showroom.cta}${icon.arrow}</a></div>
    <div class="cell"><h2>${t.frame.h2}</h2><p>${t.frame.text}</p><a class="btn btn-line" href="#request" data-intent="frame">${t.frame.cta}${icon.arrow}</a></div>
  </div></section>`;

  return heroBlock + route + season + modelsBlock + kitBlock + priceBlock + deliveryBlock + sheet + faq(c, t.faq) + requestSection(c, lang, 'garden', t);
}

function houseSection(L) {
  // Cross-section of a gable kit house. Markers 1–6 match the list next to it.
  const mk = (n, x, y) => `<g class="mk-g"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + 5}">${n}</text></g>`;
  return `<svg viewBox="0 0 560 420" role="img" aria-label="${esc(Object.values(L).join(', '))}">
    <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="hatch-line"/></pattern></defs>
    <g data-part="base"><rect x="118" y="352" width="44" height="40" class="out"/><rect x="398" y="352" width="44" height="40" class="out"/><line x1="40" y1="392" x2="520" y2="392" class="ground"/></g>
    <g data-part="floor"><rect x="110" y="330" width="340" height="22" class="in"/><path d="M110 341h340" class="in-detail"/></g>
    <g data-part="wall"><rect x="110" y="168" width="22" height="162" class="in"/><rect x="428" y="168" width="22" height="162" class="in"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M110 ${195 + i * 27}h22M428 ${195 + i * 27}h22" class="in-detail"/>`).join('')}</g>
    <g data-part="window"><rect x="428" y="214" width="22" height="70" class="glass"/><path d="M439 214v70" class="in-detail"/></g>
    <g data-part="rafters"><path d="M86 184 280 58 474 184" class="rafter"/>${[0.18, 0.36, 0.54, 0.72].map((k) => `<path d="M${86 + 194 * k} ${184 - 126 * k}l-6 -9M${474 - 194 * k} ${184 - 126 * k}l6 -9" class="batten"/>`).join('')}</g>
    <g data-part="roof"><path d="M70 176 280 40 490 176" class="cover"/></g>
    ${mk(1, 404, 64)}${mk(2, 186, 152)}${mk(3, 82, 260)}${mk(4, 478, 250)}${mk(5, 280, 312)}${mk(6, 210, 372)}
  </svg>`;
}

// ---------- business page ----------
function businessPage(c, lang, asset) {
  const t = c.business; const F = c.form; const f = numberFmt(lang);
  const naina = models.find((m) => m.id === 'naina');
  const quick = [
    field('q-site', F.site, input('q-site', 'site', { hint: F.siteHint, req: F.required.site }), { required: true }),
    field('q-phone', F.phone, input('q-phone', 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
  ].join('');
  const heroBlock = hero(c, lang, 'business', asset, 'naina', `${c.models.naina.name} · ${c.render}`, `<b>${c.models.naina.name}</b><span>${f(5)} × ${f(5)} ${c.units.m} · ${f(22)} ${c.units.m2}</span><span>${c.render}</span>`, quick);
  const spot = `<section class="spot section" aria-labelledby="spot-title"><div class="wrap spot-grid">
    <div><h2 id="spot-title">${t.spot.h2}</h2><p>${t.spot.text}</p>${specList(naina, c, lang)}</div>
    <figure class="model-plan big">${plan(naina, c, lang)}<figcaption>${c.schematic} · <a href="${catalogUrl}#page=${naina.page}" target="_blank" rel="noopener">${c.source} ${naina.page}</a></figcaption></figure>
  </div></section>`;
  const batch = `<section class="route-band dark section" aria-labelledby="batch-title"><div class="wrap"><div class="head"><h2 id="batch-title">${t.batch.h2}</h2><p>${t.batch.lead}</p></div>${routeStrip(t.batch.steps, { cls: 'route-3' })}</div></section>`;
  const scope = `<section class="scope section" aria-labelledby="scope-title"><div class="wrap scope-grid"><h2 id="scope-title">${t.scope.h2}</h2>
    <ul class="scope-list">${t.scope.rows.map(([label, s]) => `<li class="${s}"><span>${label}</span><em>${s === 'yes' ? icon.check : icon.info}${s === 'yes' ? t.scope.yes : t.scope.ask}</em></li>`).join('')}</ul></div></section>`;
  const C = t.calc;
  const calc = `<section class="payback section" aria-labelledby="calc-title"><div class="wrap payback-grid">
    <div class="head"><h2 id="calc-title">${C.h2}</h2><p>${C.lead}</p></div>
    <form class="pb" data-payback data-locale="${locale[lang]}" data-years="${esc(C.years)}" onsubmit="return false">
      ${field('pb-rate', C.rate, '<input id="pb-rate" name="rate" type="number" min="0" step="10" value="180" inputmode="numeric">')}
      ${field('pb-nights', C.nights, '<input id="pb-nights" name="nights" type="number" min="0" max="365" step="5" value="120" inputmode="numeric">')}
      ${field('pb-costs', `${C.costs} <small>(${C.costsHint})</small>`, '<input id="pb-costs" name="costs" type="number" min="0" max="95" step="5" value="35" inputmode="numeric">')}
      ${field('pb-invest', C.invest, '<input id="pb-invest" name="invest" type="number" min="0" step="1000" inputmode="numeric" placeholder="—">')}
      <dl class="pb-out"><div><dt>${C.income}</dt><dd data-income>—</dd></div><div><dt>${C.payback}</dt><dd data-payback-years>—</dd></div></dl>
    </form>
  </div></section>`;
  const steps = `<section class="route-band section" aria-labelledby="steps-title"><div class="wrap"><div class="head"><h2 id="steps-title">${t.steps.h2}</h2></div>${routeStrip(t.steps.items.map((s) => [s, '']), { cls: 'route-6' })}</div></section>`;
  return heroBlock + spot + batch + scope + calc + steps + faq(c, t.faq) + requestSection(c, lang, 'business', t);
}

// ---------- property page ----------
function propertyPage(c, lang, asset) {
  const t = c.property; const F = c.form; const f = numberFmt(lang);
  const quick = [
    field('q-phone', F.phone, input('q-phone', 'phone', { type: 'tel', hint: F.phoneHint, req: F.required.phone, auto: 'tel', mode: 'tel' }), { required: true }),
    field('q-district', F.district, select('q-district', 'district', F.districtOptions.map((o) => [o, o]))),
  ].join('');
  const heroBlock = hero(c, lang, 'property', asset, 'naina-land', `${c.models.naina66.name} · ${c.render}`, `<b>${c.models.naina66.name}</b><span>${f(31.9)} ${c.units.m2}</span><span>${c.render}</span>`, quick);
  const spot = `<section class="spot section" aria-labelledby="spot-title"><div class="wrap spot-grid">
    <div><h2 id="spot-title">${t.spot.h2}</h2><p>${t.spot.text}</p>${specList(naina66, c, lang, { withPrice: false })}</div>
    <figure class="model-plan big">${plan(naina66, c, lang)}<figcaption>${c.schematic} · <a href="${catalogUrl}#page=${naina66.page}" target="_blank" rel="noopener">${c.source} ${naina66.page}</a></figcaption></figure>
  </div></section>`;
  const handover = `<section class="handover section" aria-labelledby="hand-title"><div class="wrap scope-grid"><div><h2 id="hand-title">${t.handover.h2}</h2><p class="fine">${t.handover.note}</p></div>
    <ul class="scope-list">${t.handover.items.map(([h, d]) => `<li class="yes"><span><b>${h}</b>${d}</span></li>`).join('')}</ul></div></section>`;
  const own = `<section class="own section"><div class="wrap own-grid"><div><h2>${t.own.h2}</h2><p>${t.own.text}</p></div><a class="btn" href="${pageHref(lang, lang, 'garden')}#models">${t.own.cta}${icon.arrow}</a></div></section>`;
  return heroBlock + spot + handover + own + faq(c, t.faq) + requestSection(c, lang, 'property', t);
}

// ---------- document ----------
function render(lang, page) {
  const c = copy[lang];
  const t = c[page];
  const asset = lang === 'ka' ? 'assets/' : '../assets/';
  const root = lang === 'ka' ? '' : '../';
  const body = { garden: gardenPage, business: businessPage, property: propertyPage }[page](c, lang, asset);
  const title = fill(t.title);
  const description = fill(t.description);
  const canonical = absolute(lang, page);
  const ogImage = site.baseUrl ? `${site.baseUrl}/assets/${{ garden: 'elza', business: 'naina', property: 'naina-land' }[page]}-scene.webp` : '';
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: c.brand, ...(site.baseUrl ? { url: site.baseUrl } : {}), areaServed: 'GE', address: { '@type': 'PostalAddress', addressLocality: lang === 'ka' ? 'ბათუმი' : lang === 'ru' ? 'Батуми' : 'Batumi', addressCountry: 'GE' }, ...(site.phone ? { telephone: site.phone } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: fill(q), acceptedAnswer: { '@type': 'Answer', text: fill(a) } })) },
  ];
  const alt = (l) => (site.baseUrl ? absolute(l, page) : pageHref(lang, l, page));
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${site.index ? 'index, follow' : 'noindex, nofollow'}">
<meta name="theme-color" content="#16201b">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
${langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${alt(l)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${alt('ka')}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="${ogLocale[lang]}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}${ogImage ? `\n<meta property="og:image" content="${ogImage}">` : ''}
<link rel="icon" href="${asset}mark.svg" type="image/svg+xml">
<link rel="preload" href="${asset}firago-heavy.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${asset}firago-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}styles.css">
<script>document.documentElement.classList.add("js")</script>
<script defer src="${root}main.js"></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="p-${page}">
<a class="skip" href="#main">${c.skip}</a>
${header(c, lang, page)}
<main id="main">
${body}
</main>
${footer(c, lang, page)}
</body>
</html>
`;
}

for (const lang of langs) {
  const folder = lang === 'ka' ? dist : new URL(`${lang}/`, dist);
  await mkdir(folder, { recursive: true });
  await Promise.all(Object.keys(pages).map((page) => writeFile(new URL(pages[page], folder), render(lang, page))));
}
console.log('Built', langs.length * Object.keys(pages).length, 'pages');
