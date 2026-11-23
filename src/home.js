import { icon, shell } from './ui.js';

shell('Workflow Lab');
const demos = [
  ['dispatch', 'parcels', 'Ověření expedice', 'Ověřte stav zásilky a ověřitelnost skladového podkladu.'],
  ['booking', 'booking', 'Servisní poptávka', 'Spočítejte servis, vytvořte poptávku a projděte její záznam.'],
  ['handover', 'handover', 'Předávání závad', 'Předejte závadu technikovi a zkontrolujte výsledek opravy.'],
];
document.querySelector('#demos').innerHTML = demos.map(([url, glyph, name, description]) =>
  '<a class="surface card" href="./' + url + '/"><span class="mark">' + icon(glyph) + '</span><h2>' + name
    + '</h2><p class="muted">' + description + '</p><span class="more">Otevřít ' + icon('arrow') + '</span></a>').join('');
