import './style.css';
import logo from './brand/aardvarkland.png';

const glyphs = {
  parcels: '<path d="m3 7 9-4 9 4v10l-9 4-9-4Zm0 0 9 4 9-4m-9 4v10M7.5 5 16 9"/>',
  booking: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 3v4m10-4v4m-9 8 2 2 5-5"/>',
  handover: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM9 13l2 2 4-4"/>',
  back: '<path d="m13 6-6 6 6 6M7 12h12"/>',
  arrow: '<path d="m10 6 6 6-6 6M4 12h12"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};

export function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + glyphs[name] + '</svg>';
}

export function shell(title, context) {
  const depth = document.body.dataset.screen === 'home' ? './' : '../';
  document.querySelector('header').innerHTML = '<a class="brand" href="' + depth + '"><img src="' + logo
    + '" alt="" width="31" height="31"><span>Aardvarkland <strong>' + title + '</strong></span></a>'
    + (context ? '<span class="header-context">' + context + '</span>' : '');
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = logo;
  document.head.append(favicon);
}
