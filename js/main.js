const MODE_DUMMY = 0;
const MODE_ADD = 1;
const MODE_EDIT = 2;
const MODE_MOVE = 3;
const MODE_DEL = 4;

var places = [];
var roads = [];

var mode = MODE_DUMMY;
var nextLocId = 0;

var map = L.map('map').setView([22.29429, 114.16857], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on(
	'click',
	function(e) {
		createPlace(e);
    }
);
