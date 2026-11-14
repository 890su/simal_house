const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const list = gallery.querySelector('.gallery-nav');
  const tabs = Array.from(list.querySelectorAll('[data-show]'));
  const panels = Array.from(gallery.querySelectorAll('[data-panel]'));
  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.id = `tab-${tab.dataset.show}`;
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].tabIndex = 0;
  });

  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }

  function selectFromLocation() {
    const index = panels.findIndex((panel) => `#${panel.id}` === location.hash);
    if (index >= 0) selectTab(index);
  }

  selectTab(0);
  selectFromLocation();
  window.addEventListener('hashchange', selectFromLocation);
  for (const [index, tab] of tabs.entries()) {
    function activate(next) {
      selectTab(next, true);
      history.replaceState(null, '', `#${panels[next].id}`);
    }
    tab.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(index);
    });
    tab.addEventListener('keydown', (event) => {
      const targets = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      activate(targets[event.key]);
    });
  }
}

const form = document.querySelector('[data-request]');
const dialog = document.querySelector('#plan-dialog');
for (const button of document.querySelectorAll('[data-plan]')) {
  button.addEventListener('click', () => {
    const template = document.getElementById(`plan-${button.dataset.plan}`);
    dialog.querySelector('[data-plan-body]').replaceChildren(template.content.cloneNode(true));
    dialog.querySelector('[data-model]').dataset.model = button.dataset.plan;
    dialog.showModal();
  });
}

for (const link of document.querySelectorAll('[data-model], [data-package]')) {
  link.addEventListener('click', () => {
    const field = link.hasAttribute('data-model') ? 'model' : 'package';
    form.elements.namedItem(field).value = link.dataset[field];
    if (dialog?.open) dialog.close();
  });
}

let requestUrl;
const place = form?.elements.namedItem('place');
const error = document.querySelector('#place-error');

function setPlaceError(message) {
  place.setCustomValidity(message);
  if (message) place.setAttribute('aria-invalid', 'true');
  else place.removeAttribute('aria-invalid');
  error.textContent = message;
  error.hidden = !message;
}

place?.addEventListener('invalid', () => setPlaceError(form.dataset.required));
place?.addEventListener('input', () => setPlaceError(''));

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (place && !place.value.trim()) {
    setPlaceError(form.dataset.required);
    place.reportValidity();
    return;
  }
  const lines = [];
  for (const control of form.querySelectorAll('select, input')) {
    const value = control.selectedOptions?.[0]?.textContent ?? control.value.trim();
    if (value) lines.push(`${control.labels[0].querySelector('span').textContent} — ${value}`);
  }
  const file = new Blob(['\ufeff', form.dataset.title, '\n\n', lines.join('\n'), '\n'], { type: 'text/plain;charset=utf-8' });
  if (requestUrl) URL.revokeObjectURL(requestUrl);
  requestUrl = URL.createObjectURL(file);
  const download = document.createElement('a');
  download.href = requestUrl;
  download.download = 'cabin-request.txt';
  download.textContent = form.dataset.download;
  const result = form.querySelector('[data-result]');
  result.replaceChildren(form.dataset.ready, download);
  result.hidden = false;
});
