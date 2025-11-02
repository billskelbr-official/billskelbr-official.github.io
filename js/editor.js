const TRAIN_LENGTH = 2.5;
const MARGIN_LENGTH = 5;
const BUFFER_LENGTH = 2.5;

const ROAD_COLOURS = [
	"grey",
	"black",
	"blue",
	"green",
	"orange",
	"purple",
	"red",
	"white",
	"yellow"
]
const NUM_COLOURS = ROAD_COLOURS.length;

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
	if (mode_add_point1 != null) {
		mode_add_point1.setStyle({color: "#3388ff"});
		mode_add_point1 = null;
	}
}

function addMkr(location, name)
{
	var m = new L.Circle(location, {radius: 150, bubblingMouseEvents: false}).addTo(places_layer);
	m.bindTooltip(name, {permanent: true, interactive: true, bubblingMouseEvents: false}).openTooltip();
	m.on(
		"click",
		mkrClick
	);
	m.getTooltip().on(
		"click",
		function() {
			click_on(m.getElement());
		}
	);
	return m;
}

function mkrClick(mkr)
{
	mkr = mkr.target;

	if (mode == MODE_DEL) {
		var obj = find_place_with_latlng(mkr.getLatLng());
		var del_arr = roads.filter(function(item){return item.points[0] == obj.id || item.points[1] == obj.id});
		for (var i = 0; i < del_arr.length; i++) {
			for (var j = 0; j < del_arr[i].lines.length; j++) {
				del_arr[i].lines[j].bg.remove();
				del_arr[i].lines[j].fill.remove();
			}
		}
		roads = roads.filter(function(item){return item.points[0] != obj.id && item.points[1] != obj.id});

		places = places.filter(function(item) {
    		return item.loc != mkr.getLatLng()
		})
		mkr.remove();
		return;
	}

	if (mode == MODE_ADD) {
		if (mode_add_point1 == null) {
			mode_add_point1 = mkr;
			mkr.setStyle({color: "red"});
		} else {
			createRoad(mode_add_point1, mkr);
			mode_add_point1.setStyle({color: "#3388ff"});
			mode_add_point1 = null;
		}
	}

	if (mode == MODE_EDIT) {
		var tgt = find_place_with_latlng(mkr.getLatLng());
		if (tgt == null) {
			abort();
		}
		var newname = prompt("New name for <"+tgt.name+">");
		if (newname == null) {
			return;
		}
		tgt.name = newname;
		tgt.mkr.getTooltip().setContent(newname);
	}
}

function lineClick(deets)
{
	if (mode == MODE_ADD) {
		createRoad(deets.ends[0].mkr, deets.ends[1].mkr);
		return;
	}

	if (mode == MODE_EDIT) {
		var rd = find_road_with_ids([deets.ends[0].id, deets.ends[1].id]);
		var str = "Enter new colour id (was " + rd.colours[deets.lane] + "); defaults to grey\n";
		for (var i = 0; i < NUM_COLOURS; i++) {
			str += "\t" + i + "\t" + ROAD_COLOURS[i] + "\n";
		}
		var newColour = prompt(str);
		newColour %= NUM_COLOURS;
		if (newColour == NaN) {
			newColour = 0;
		}
		rd.colours[deets.lane] = newColour;
		rd.lines[deets.lane].fill.setStyle({color: ROAD_COLOURS[newColour]});
	}
}

function mapClickHandler(e)
{
	if (mode != MODE_ADD) {
		return;
	}
	var name = prompt("Name of point");
	if (name == null) {
		return;
	}
	createPlace(e.latlng, name);
}

function createPlace(loc, name)
{
	if (mode != MODE_ADD) {
		return;
	}

	places.push({id: nextLocId++, loc: loc, name: name, mkr: addMkr(loc, name)});
}

function createRoad(mkr0, mkr1)
{
	var point1 = null;
	var point2 = null;

	if (mkr0.getLatLng() == mkr1.getLatLng()) {
		return null;
	}

	point1 = find_place_with_latlng(mkr0.getLatLng());
	point2 = find_place_with_latlng(mkr1.getLatLng());
	if (point1.id > point2.id) {
		var tmp = point1;
		point1 = point2;
		point2 = tmp;
	}

	var colour = Math.floor(Math.random() * (NUM_COLOURS));

	var target = null;
	for (var i = 0; i < roads.length; i++) {
		if ((roads[i].points[0] == point1.id && roads[i].points[1] == point2.id) || (roads[i].points[0] == point2.id && roads[i].points[1] == point1.id)) {
			target = roads[i];
			break;
		}
	}
	if (target == null) {
		var obj = {points: [point1.id, point2.id], lanes: 0, colours: [], lines: []};
		roads.push(obj);
		target = roads[roads.length-1];
	}

	if (target.lanes == 3) {
		alert("cannot have more than 3 lanes!");
		return;
	}

	var bearing = (L.GeometryUtil.bearing(point1.loc, point2.loc) + (target.lanes == 2 ? 90 : 270)) % 360 - 180;
	var np1 = L.GeometryUtil.destination(point1.loc, bearing, target.lanes == 0 ? 0 : 50);
	var np2 = L.GeometryUtil.destination(point2.loc, bearing, target.lanes == 0 ? 0 : 50);

	var deets = {ends: [point1, point2], lane: target.lanes};
	var bgline = L.polyline([np1, np2], {customData: deets, weight: 10, color: "black", bubblingMouseEvents: false}).addTo(roads_layer).on("click", function(){lineClick(deets)})
	var fillline = L.polyline([np1, np2], {customData: deets, weight: 8, color: ROAD_COLOURS[colour], bubblingMouseEvents: false}).addTo(roads_layer).bringToBack().on("click", function(){lineClick(deets)})
	bgline.bringToBack();

	var lines = {
		bg: bgline,
		fill: fillline
	};

	target.colours.push(colour);
	target.lines.push(lines);
	target.lanes += 1;
	return;
}

function clearRoad(road)
{
	for (var i = 0; i < road.lines.length; i++) {
		road.lines[i].bg.remove();
		road.lines[i].fill.remove();
	}
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
	var true_bound_bl = L.GeometryUtil.destination({lat: miny, lng: minx}, 225.0, min_length * 1.41421356237 * MARGIN_LENGTH / (TRAIN_LENGTH + BUFFER_LENGTH));
	var true_bound_tr = L.GeometryUtil.destination({lat: maxy, lng: maxx}, 45.0, min_length * 1.41421356237 * MARGIN_LENGTH / (TRAIN_LENGTH + BUFFER_LENGTH));
	miny = true_bound_bl.lat;
	minx = true_bound_bl.lng;
	maxy = true_bound_tr.lat;
	maxx = true_bound_tr.lng;

	var real_x = map.distance({lat: miny, lng: minx}, {lat: miny, lng: maxx});
	var real_y = map.distance({lat: miny, lng: minx}, {lat: maxy, lng: minx});
	var dimx = real_x / min_length * (TRAIN_LENGTH + BUFFER_LENGTH);
	var dimy = real_y / min_length * (TRAIN_LENGTH + BUFFER_LENGTH);

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
				x: map.distance(places[i].loc, {lat: places[i].loc.lat, lng: minx}) / min_length * (TRAIN_LENGTH + BUFFER_LENGTH) - 1.25,
				y: map.distance(places[i].loc, {lat: miny, lng: places[i].loc.lng}) / min_length * (TRAIN_LENGTH + BUFFER_LENGTH) - 1.25
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
				colour: ROAD_COLOURS[roads[i].colours[j]],
				wildcardAmount: 0
			});
		}
		destobj.roads.push({
			id: next_id++,
			placeIds: roads[i].points,
			spaceAmount:
				Math.floor(
					(
						(
							map.distance(
								find_place_with_id(roads[i].points[0]).loc,
								find_place_with_id(roads[i].points[1]).loc
							)
							/ min_length * (TRAIN_LENGTH + BUFFER_LENGTH)
						) - BUFFER_LENGTH
					)
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
