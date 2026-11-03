/* SEYVEO My World Air · focused local navigation search.
   No route replacement and no changes to the original buttons. */
(() => {
  'use strict';
  const input = document.getElementById('lifeAirSearchInput');
  const toggle = document.getElementById('lifeAirSearchToggle');
  const box = document.getElementById('lifeAirSearchBox');
  const grid = document.getElementById('calendarSpaces');
  const empty = document.getElementById('lifeAirNoResults');
  const todayPanel = document.getElementById('lifeToday');
  const todayDate = document.getElementById('lifeTodayDate');
  const todayBody = document.getElementById('lifeTodayBody');
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
    if (todayPanel) todayPanel.hidden = false;
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
      if (todayPanel) todayPanel.hidden = true;
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


  /* Today reads the already approved local sources. It never creates records,
     guesses health information or merges business data into the personal world. */
  const TODAY_EVENTS = 'seyveo-calendar-events-v1';
  const TODAY_TASKS = 'seyveo-personal-tasks-v1';
  const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
  const localRows = (key, max) => {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(rows) ? rows.slice(-max) : [];
    } catch {
      return [];
    }
  };
  const todaySvg = (kind) => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'sv-world-today-icon');
    svg.setAttribute('aria-hidden', 'true');
    const shape = kind === 'event'
      ? ['M5 6h14v14H5z', 'M8 3v6M16 3v6M5 11h14']
      : kind === 'task'
        ? ['M4 12.2l5.2 5.1L20 6.5']
        : ['M4 10h16v11H4z', 'M3 7h18v3H3z', 'M12 7v14', 'M12 7c-5.8 0-6.1-6.2-2.4-4.4C11.1 3.3 12 7 12 7ZM12 7s.9-3.7 2.4-4.4C18.1.8 17.8 7 12 7Z'];
    for (const d of shape) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    }
    return svg;
  };
  const makeTodayRow = ({ kind, title, caption, route }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sv-world-today-item';
    btn.dataset.worldTodayRoute = route;
    btn.dataset.worldTodayKind = kind;
    btn.setAttribute('aria-label', title + '. ' + caption);
    const content = document.createElement('span');
    content.className = 'sv-world-today-copy';
    const name = document.createElement('strong');
    name.textContent = title;
    const detail = document.createElement('small');
    detail.textContent = caption;
    content.append(name, detail);
    const chevron = document.createElement('span');
    chevron.className = 'sv-world-today-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    btn.append(todaySvg(kind), content, chevron);
    return btn;
  };
  const openTodayRoute = (route) => {
    if (route === '#calendar') document.getElementById('calendarToday')?.click();
    if (location.hash !== route) location.hash = route;
  };
  if (todayPanel) todayPanel.addEventListener('click', (event) => {
    const target = event.target.closest('[data-world-today-route]');
    if (!target || !todayPanel.contains(target)) return;
    const route = target.dataset.worldTodayRoute;
    if (route === '#calendar' || route === '#tasks') openTodayRoute(route);
  });
  const todayDateLabel = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  const validTime = /^([01]\\d|2[0-3]):[0-5]\\d$/;
  function renderToday() {
    if (!todayPanel || !todayDate || !todayBody) return;
    const now = new Date();
    const today = dateKey(now);
    const label = todayDateLabel.format(now);
    todayDate.dateTime = today;
    todayDate.textContent = label.charAt(0).toLocaleUpperCase('ru-RU') + label.slice(1);
    const events = localRows(TODAY_EVENTS, 300)
      .filter((item) => item && item.date === today && item.kind !== 'business' &&
        typeof item.title === 'string' && item.title.trim())
      .map((item) => ({
        title: item.title.trim().slice(0, 140),
        time: validTime.test(item.time || '') ? item.time : ''
      }))
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00') ||
        a.title.localeCompare(b.title, 'ru'));
    const tasks = localRows(TODAY_TASKS, 150)
      .filter((item) => item && item.due === today && item.done !== true &&
        typeof item.title === 'string' && item.title.trim())
      .map((item) => ({ title: item.title.trim().slice(0, 140) }));
    // Only important personal dates. Health records are never surfaced here.
    const fromSpaces = window.SEYVEO_SPACES?.calendarItems?.(today);
    const dates = (Array.isArray(fromSpaces) ? fromSpaces : [])
      .filter((item) => item?.space === 'world' &&
        ['День рождения', 'Важная дата'].includes(item.kind) &&
        typeof item.title === 'string' && item.title.trim());
    const highlighted = [];
    if (events[0]) highlighted.push({ kind: 'event', title: events[0].title,
      caption: events[0].time ? events[0].time + ' · Календарь' : 'Событие · Календарь',
      route: '#calendar' });
    if (tasks[0]) highlighted.push({ kind: 'task', title: tasks[0].title,
      caption: 'Личное дело · Сегодня', route: '#tasks' });
    if (dates[0]) highlighted.push({ kind: 'date', title: dates[0].title.slice(0, 110),
      caption: dates[0].kind, route: '#calendar' });
    todayBody.replaceChildren();
    todayPanel.dataset.empty = String(highlighted.length === 0);
    if (!highlighted.length) {
      // A quiet empty state replaces the former two stacked lines.
      // Its only action opens the real Calendar, without creating mock plans.
      const emptyRow = document.createElement('button');
      emptyRow.type = 'button';
      emptyRow.className = 'sv-world-today-empty';
      emptyRow.dataset.worldTodayRoute = '#calendar';
      emptyRow.setAttribute('aria-label',
        'Личных записей на сегодня нет. Открыть календарь');
      const info = document.createElement('span');
      info.className = 'sv-world-today-empty-label';
      info.textContent = 'На сегодня записей нет';
      const go = document.createElement('span');
      go.className = 'sv-world-today-empty-link';
      go.textContent = 'Календарь ›';
      emptyRow.append(info, go);
      todayBody.append(emptyRow);
      return;
    }
    for (const item of highlighted) todayBody.append(makeTodayRow(item));
    const more = events.length + tasks.length + dates.length - highlighted.length;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'sv-world-today-more';
    action.dataset.worldTodayRoute = '#calendar';
    action.textContent = more > 0 ? 'Ещё записи · В календаре ›' : 'Открыть календарь ›';
    todayBody.append(action);
  }
  let dayTimer = 0;
  function scheduleToday() {
    clearTimeout(dayTimer);
    if (location.hash !== '#life') return;
    renderToday();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    dayTimer = setTimeout(scheduleToday, Math.max(1000, midnight.getTime() - now.getTime() + 100));
  }
  for (const name of ['seyveo:calendar-changed', 'seyveo:tasks-changed',
    'seyveo:spaces-changed', 'storage', 'pageshow', 'focus']) {
    window.addEventListener(name, () => {
      if (location.hash === '#life') renderToday();
    });
  }
  // Direct deep-links can render before the other deferred personal modules
  // are ready; re-read once their scripts have finished executing.
  document.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#life') renderToday();
  });
  window.addEventListener('hashchange', scheduleToday);
  window.addEventListener('seyveo:route-changed', () => {
    if (location.hash === '#life') renderToday();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && location.hash === '#life') scheduleToday();
  });
  scheduleToday();

  refresh();
})();
