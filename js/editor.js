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
var config = {
	circle_radius: 150
}

function configure()
{
	var resp = prompt(
		"Radius of point markers in metres (was " + config.circle_radius +")\n" +
		"Note that small radii may result in multilane roads being displayed weirdly"
	);
	/* both if resp == null or "0" */
	if (Number(resp) == 0) {
		return;
	}
	config.circle_radius = Number(resp);

	for (var i = 0; i < places.length; i++) {
		places[i].mkr.setRadius(config.circle_radius);
	}
}

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
	var m = new L.Circle(location, {radius: config.circle_radius, bubblingMouseEvents: false}).addTo(places_layer);
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
		if (obj == undefined) {
			alert("error: no place with location " + mkr.getLatLng());
			return;
		}
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
			buildNewRoad(find_place_with_latlng(mode_add_point1.getLatLng()), find_place_with_latlng(mkr.getLatLng()));
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
		buildNewRoad(deets.ends[0], deets.ends[1]);
		return;
	}

	if (mode == MODE_DEL) {
		var road = find_road_with_ids([deets.ends[0].id, deets.ends[1].id]);
		if (road == undefined) {
			alert("error: nonexistent road");
			return;
		}
		clearRoad(road);
		roads = roads.filter(function(item){return item != road});
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
	createPlace(nextLocId++, e.latlng, name);
}

function createPlace(id, loc, name)
{
	places.push({id: id, loc: loc, name: name, mkr: addMkr(loc, name)});
}

function buildNewRoad(pt0, pt1)
{
	createRoad(pt0, pt1, Math.floor(Math.random() * (NUM_COLOURS)));
}


function createRoad(from, to, colour)
{
	var point1 = null;
	var point2 = null;

	if (from.loc == to.loc) {
		return null;
	}

	point1 = from;
	point2 = to;
	if (point1.id > point2.id) {
		var tmp = point1;
		point1 = point2;
		point2 = tmp;
	}

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

function importButtonHandler(func_ptr)
{
	const selectedFile = document.getElementById("filepicker").files[0];
	if (selectedFile == undefined) {
		alert("no file selected!");
		return;
	}
	const fr = new FileReader();
	fr.onload = () => {
		func_ptr(fr.result);
	};
	fr.readAsText(selectedFile);
}

function importMapFromBoard(str)
{
	var obj;
	var origin;
	var bound;
	var dim;
	var max_place_id = -1;

	places = [];
	roads = [];
	places_layer.clearLayers();
	roads_layer.clearLayers();

	try {
		obj = JSON.parse(str);
	} catch {
		alert("fatal error: malformed input file");
		return;
	}

	origin = {lat: obj.boundingBox.bottom, lng: obj.boundingBox.left};
	bound = {lat: obj.boundingBox.top, lng: obj.boundingBox.right};
	dim = obj.dimensions.full;
	for (var i = 0; i < obj.places.length; i++) {
		var p = obj.places[i];
		createPlace(
			p.id,
			{
				lat: origin.lat + p.coordinate.y / dim.height * (bound.lat - origin.lat),
				lng: origin.lng + p.coordinate.x / dim.width * (bound.lng - origin.lng)
			},
			p.name,
		);
		if (p.id > max_place_id) {
			max_place_id = p.id;
		}
	}
	nextLocId = max_place_id + 1;
	for (var i = 0; i < obj.roads.length; i++) {
		var r = obj.roads[i];
		var from = find_place_with_id(r.placeIds[0]);
		var to = find_place_with_id(r.placeIds[1]);
		for (var j = 0; j < r.lanes.length; j++) {
			var c = 0;
			for (var k = 0; k < NUM_COLOURS; k++) {
				if (ROAD_COLOURS[k] == r.lanes[j].colour) {
					c = k;
					break;
				}
			}
			createRoad(from, to, c);
		}
	}
}

function importMapFromSaved(str)
{
	var obj = JSON.parse(str);
	var places_arr = obj.places;
	var roads_arr = obj.roads;

	if (places_arr == undefined || roads_arr == undefined) {
		alert("malformed JSON; did you mean to try importing from board?")
		return;
	}

	places = [];
	roads = [];
	places_layer.clearLayers();
	roads_layer.clearLayers();

	nextLocId = 0;
	for (var i = 0; i < places_arr.length; i++) {
		if (places_arr[i].id > nextLocId) {
			nextLocId = places_arr[i].id + 1;
		}
		createPlace(places_arr[i].id, places_arr[i].loc, places_arr[i].name);
	}
	for (var i = 0; i < roads_arr.length; i++) {
		var from = find_place_with_id(roads_arr[i].points[0]);
		var to = find_place_with_id(roads_arr[i].points[1]);

		if (from == undefined || to == undefined) {
			alert("error: failed to build road: " + roads_arr[i].points);
			return;
		}

		for (var j = 0; j < roads_arr[i].lanes; j++) {
			createRoad(from, to, roads_arr[i].colours[j]);
		}
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

function saveMap()
{
	var obj = {places:[], roads:[]};

	for (var i = 0; i < places.length; i++) {
		obj.places.push({id: places[i].id, loc: places[i].loc, name: places[i].name});
	}
	for (var i = 0; i < roads.length; i++) {
		obj.roads.push({points: roads[i].points, lanes: roads[i].lanes, colours: roads[i].colours});
	}

	write2file("saved_map.json", JSON.stringify(obj));
}
