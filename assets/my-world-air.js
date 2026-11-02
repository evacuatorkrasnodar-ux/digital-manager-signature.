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

  if (toggle && box) {
    toggle.addEventListener('click', () => {
      const opening = box.hidden;
      box.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
      if (opening) {
        input.focus({ preventScroll: true });
      } else {
        input.value = '';
        refresh();
      }
    });
  }
  input.addEventListener('input', refresh);
  input.addEventListener('search', refresh);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (input.value) {
        input.value = '';
        refresh();
      } else input.blur();
    } else if (event.key === 'Enter') {
      const visible = entries().filter(button =>
        !button.hidden && !button.classList.contains('sv-world-filtered-out') &&
        getComputedStyle(button).display !== 'none');
      input.blur();
      if (visible.length === 1) visible[0].click();
    }
  });

  refresh();
})();
