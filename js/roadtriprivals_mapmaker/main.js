const MODE_DUMMY = 0;
const MODE_ADD = 1;
const MODE_EDIT = 2;
const MODE_MOVE = 3;
const MODE_DEL = 4;

var places = [];
var places_layer = L.layerGroup();
var roads = [];
var roads_layer = L.layerGroup();

var mode = MODE_DUMMY;
var nextLocId = 0;

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map("map", {
    center: [22.29429, 114.16857],
    zoom: 13,
    layers: [osm, roads_layer, places_layer]
});
var layerControl = L.control.layers({"osm": osm});
layerControl.addTo(map);
map.on(
	'click',
	mapClickHandler
);
setMode(MODE_ADD);
