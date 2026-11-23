import { shell } from './ui.js';
import markup from '../wordpress/aardvarkland-booking/booking.html?raw';
import '../wordpress/aardvarkland-booking/booking.css';
import { bindBookings } from '../wordpress/aardvarkland-booking/booking.js';

shell('Workflow Lab', 'Servisní web');
document.querySelector('#booking').innerHTML = '<div class="page-title"><h1>Servis klimatizací</h1>'
  + '<p class="lede">Objednejte čištění filtrů, kontrolu odvodu kondenzátu a zkoušku chlazení.</p></div>' + markup;
bindBookings();
