/* SEYVEO My World Air · focused local navigation search.
   No route replacement and no changes to the original buttons. */
(() => {
  'use strict';
  const input = document.getElementById('lifeAirSearchInput');
  const toggle = document.getElementById('lifeAirSearchToggle');
  const box = document.getElementById('lifeAirSearchBox');
  const grid = document.getElementById('calendarSpaces');
  const empty = document.getElementById('lifeAirNoResults');
  if (!input || !grid || !empty) return;

  const normalize = (value) => String(value || '')
    .toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();

  const aliases = {
    calendar: 'даты события расписание',
    notes: 'записи заметки',
    health: 'пульс давление',
    care: 'привычки напоминания',
    family: 'семейный чат',
    contacts: 'телефон люди',
    'smart-home': 'дом устройства',
    documents: 'файлы бумаги',
    wallet: 'кошелек оплата карта',
    mail: 'письма email',
    browser: 'интернет сайты поиск',
    music: 'плеер песни аудио'
  };

  const entries = () => Array.from(grid.querySelectorAll('.calendar-space-button'));
  const refresh = () => {
    const query = normalize(input.value);
    let shown = 0;
    for (const button of entries()) {
      const title = button.querySelector('span')?.textContent || '';
      const key = button.dataset.calendarSpace || '';
      const match = !query || normalize(title + ' ' + key + ' ' + (aliases[key] || '')).includes(query);
      button.classList.toggle('sv-world-filtered-out', !match);
      if (match && !button.hidden && getComputedStyle(button).display !== 'none') shown++;
    }
    empty.hidden = shown !== 0;
  };

  const closeSearch = (returnFocus = false) => {
    if (!toggle || !box) return;
    box.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть поиск по разделам');
    toggle.setAttribute('title', 'Поиск');
    input.value = '';
    input.blur();
    refresh();
    if (returnFocus) toggle.focus({ preventScroll: true });
  };
  if (toggle && box) {
    toggle.addEventListener('click', () => {
      const opening = box.hidden;
      if (!opening) {
        closeSearch();
        return;
      }
      box.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Закрыть поиск по разделам');
      toggle.setAttribute('title', 'Закрыть поиск');
      input.focus({ preventScroll: true });
    });
  }
  // A destination tap dismisses the temporary search; returning to My World
  // shows the full familiar grid, not stale filtered results.
  grid.addEventListener('click', (event) => {
    if (event.target.closest('.calendar-space-button')) closeSearch();
  });
  const closeWhenLeavingWorld = () => {
    if (location.hash !== '#life' && box && !box.hidden) closeSearch();
  };
  window.addEventListener('hashchange', closeWhenLeavingWorld);
  window.addEventListener('popstate', closeWhenLeavingWorld);
  document.addEventListener('pointerdown', (event) => {
    if (box && !box.hidden && !box.contains(event.target) &&
        !toggle?.contains(event.target) && !grid.contains(event.target)) {
      closeSearch();
    }
  });

  input.addEventListener('input', refresh);
  input.addEventListener('search', refresh);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (input.value) {
        input.value = '';
        refresh();
      } else closeSearch(true);
    } else if (event.key === 'Enter') {
      const visible = entries().filter(button =>
        !button.hidden && !button.classList.contains('sv-world-filtered-out') &&
        getComputedStyle(button).display !== 'none');
      if (visible.length === 1) {
        input.blur();
        visible[0].click();
      }
    }
  });

  refresh();
})();
