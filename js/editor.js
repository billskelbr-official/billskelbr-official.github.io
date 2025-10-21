const TRAIN_LENGTH = 4.2;
const MARGIN_LENGTH = 5;
const BUFFER_LENGTH = 2.5;

var mode_add_point1 = null;

function setMode(m)
{
	mode = m;
	str = "button_setmode_";
	switch (mode) {
	case MODE_ADD:
		str += "add";
		break;
	case MODE_EDIT:
		str += "edit";
		break;
	case MODE_MOVE:
		str += "move";
		break;
	case MODE_DEL:
		str += "del";
		break;
	}
	buttons = document.getElementsByClassName("mode_button");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.backgroundColor = "white";
	}
	document.getElementById(str).style.backgroundColor = "lightblue";

	resetMode();
}

function resetMode()
{
	mode_add_point1 = null;
}

function addMkr(location, name)
{
	var m = new L.Circle(location, {radius: 150, bubblingMouseEvents: false}).addTo(map);
	m.bindTooltip(name, {permanent: true}).openTooltip();
	m.on(
		"click",
		function(mkr) {
			mkrClick(mkr);
		}
	)
}

function mkrClick(mkr)
{
	mkr = mkr.sourceTarget;

	if (mode == MODE_DEL) {
		for (var i = 0; i < places.length; i++) {
			if (places[i].loc == mkr.getLatLng()) {
				places = places.filter(function(item) {
    				return item !== places[i];
				})
			}
		}
		mkr.remove();
		return;
	}

	if (mode == MODE_ADD) {
		if (mode_add_point1 == null) {
			mode_add_point1 = mkr;
			mkr.setStyle({color: "red"});
		} else {
			var point1;
			var point2;

			if (mode_add_point1 == mkr) {
				mkr.setStyle({color: "#3388ff"});
				mode_add_point1 = null;
				return;
			}

			for (var i = 0; i < places.length; i++) {
				if (places[i].loc == mode_add_point1.getLatLng()) {
					point1 = places[i];
				}
			}
			for (var i = 0; i < places.length; i++) {
				if (places[i].loc == mkr.getLatLng()) {
					point2 = places[i];
				}
			}

			mode_add_point1.setStyle({color: "#3388ff"});
			mode_add_point1 = null;

			for (var i = 0; i < roads.length; i++) {
				if ((roads[i].points[0] == point1.id && roads[i].points[1] == point2.id) || (roads[i].points[0] == point2.id && roads[i].points[1] == point1.id)) {
					roads[i].lanes += 1;
					return;
				}
			}
			roads.push({points: [point1.id, point2.id], lanes: 1});
			L.polyline([point1.loc, point2.loc], {weight: 5}).addTo(map);
		}
	}
}

function createPlace(e)
{
	if (mode != MODE_ADD) {
		return;
	}
	var name = prompt("Name of point");
	if (name == null) {
		return;
	}
	places.push({id: nextLocId++, loc: e.latlng, name: name});

	addMkr(e.latlng, name);
}

function generateMap()
{
	destobj = {};

	if (places.length == 0 || roads.length == 0) {
		return generate_fail("no places or roads");
	}

	var map_name = prompt("Map name");
	if (map_name == null) {
		return;
	}
	destobj.info = {
		id: "00000000-0000-0000-0000-000000000000",
		name: map_name,
		icon: "",
		boardSize: "rectangle-medium"
	};
	destobj.design = {
		boardColour: "sky",
		tickets: {
			colour: "orange",
			coverColour: "orange"
		},
		showRoads: true
	};

	/* use shortest road as length 1 (TRAIN_LENGTH cm) */
	var min_length = 999999999999999;
	for (var i = 0; i < roads.length; i++) {
		var place1 = find_place_with_id(roads[i].points[0]);
		var place2 = find_place_with_id(roads[i].points[1]);
		if (place1 == null || place2 == null) {
			return generate_fail("nonexistent place id");
		}
		var this_distance = map.distance(place1.loc, place2.loc);

		if (this_distance < min_length) {
			min_length = this_distance;
		}
	}

	var minx = 999999999999999;
	var maxx = -999999999999999;
	var miny = 999999999999999
	var maxy = -999999999999999;
	for (var i = 0; i < places.length; i++) {
		var coords = places[i].loc;
		var x = coords.lng;
		var y = coords.lat;
		if (minx > x) {
			minx = x;
		}
		if (maxx < x) {
			maxx = x;
		}
		if (miny > y) {
			miny = y;
		}
		if (maxy < y) {
			maxy = y;
		}
	}

	/* add MARGIN_LENGTH cm border from all points */

	var true_bound_bl = L.GeometryUtil.destination({lat: miny, lng: minx}, 225.0, min_length * 1.41421356237 * MARGIN_LENGTH / TRAIN_LENGTH);
	var true_bound_tr = L.GeometryUtil.destination({lat: maxy, lng: maxx}, 45.0, min_length * 1.41421356237 * MARGIN_LENGTH / TRAIN_LENGTH);
	miny = true_bound_bl.lat;
	minx = true_bound_bl.lng;
	maxy = true_bound_tr.lat;
	maxx = true_bound_tr.lng;

	var real_x = map.distance({lat: miny, lng: minx}, {lat: miny, lng: maxx});
	var real_y = map.distance({lat: miny, lng: minx}, {lat: maxy, lng: minx});
	var dimx = real_x / min_length * TRAIN_LENGTH + BUFFER_LENGTH;
	var dimy = real_y / min_length * TRAIN_LENGTH + BUFFER_LENGTH;

	destobj.dimensions = {
		full: {
			width: dimx,
			height: dimy
		},
		play: {
			width: dimx,
			height: dimy
		},
		print: {
			width: dimx * 120,
			height: dimy * 120
		}
	};
	destobj.rules = {
		vehicleAmount: 1
	};

	destobj.places = []
	for (var i = 0; i < places.length; i++) {
		destobj.places.push({
			id: places[i].id,
			name: places[i].name,
			coordinate: {
				x: map.distance(places[i].loc, {lat: places[i].loc.lat, lng: minx}) / min_length * TRAIN_LENGTH - 1.5,
				y: map.distance(places[i].loc, {lat: miny, lng: places[i].loc.lng}) / min_length * TRAIN_LENGTH - 1.5
			},
			label: {
				offset: {x: 0, y: 0},
				dimensions: {width: 2, height: 0.6},
				isValidPlacement: true
			}
		});
	}

	destobj.roads = [];
	var next_id = 0;
	var lane_id = 0;
	for (var i = 0; i < roads.length; i++) {
		var lanes = [];
		for (var j = 0; j < roads[i].lanes; j++) {
			lanes.push({
				id: lane_id++,
				colour: "grey",
				wildcardAmount: 0
			});
		}
		destobj.roads.push({
			id: next_id++,
			placeIds: roads[i].points,
			spaceAmount:
				Math.floor(
					((map.distance(
						find_place_with_id(roads[i].points[0]).loc,
						find_place_with_id(roads[i].points[1]).loc
					)
					/ min_length * (TRAIN_LENGTH + BUFFER_LENGTH)) - BUFFER_LENGTH)
					/ TRAIN_LENGTH
				),
			lanes: lanes,
			curvature: 0
		});
	}

	destobj.routeDecks = {
		standard: [],
		hotspots: [],
		highways: [],
	};

	destobj.placements = {
		attribution: {x: 0, y: 0}
	};

	destobj.boundingBox = {
		left: minx,
		bottom: miny,
		right: maxx,
		top: maxy
	};

	write2file("board.json", JSON.stringify(destobj));
}
