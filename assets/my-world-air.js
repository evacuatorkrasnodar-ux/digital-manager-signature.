/* SEYVEO My World · real personal day from the canonical local events hub.
 * The one global Search button belongs to the dock, not this page. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const todayPanel=$('lifeToday'),todayDate=$('lifeTodayDate'),todayBody=$('lifeTodayBody');
const dateKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
$('lifeManageEntry')?.addEventListener('click',()=>{location.hash='#manage'});
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
  function renderToday() {
    if (!todayPanel || !todayDate || !todayBody) return;
    const now = new Date();
    const today = dateKey(now);
    const label = todayDateLabel.format(now);
    todayDate.dateTime = today;
    todayDate.textContent = label.charAt(0).toLocaleUpperCase('ru-RU') + label.slice(1);
    const snapshot = window.SEYVEO_LIFE_EVENTS?.day(today);
    const events = snapshot?.events || [];
    const tasks = snapshot?.tasks || [];
    // These private dates stay inside My World, never in public Home alerts.
    const dates = snapshot?.dates || [];
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
  for (const name of ['seyveo:life-events-changed', 'pageshow', 'focus']) {
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


})();
