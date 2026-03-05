var map;
var resources;
var areas = [];

function board_init(user, resources_url)
{
	var res;
	var team_banner = document.getElementById("yourteam");

	team_banner.innerHTML = "You are Player " + user;
	if (user == 1) {
		team_banner.class
	}

	res = http_get_json(resources_url);
	if (res == null) {
		alert("fatal error: could not initialise resources\nreload page now");
		window.location.reload();
	}

	try {
		map = L.map('map').setView(res.map.center, 13);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		bases = res.map.bases;

		/* add the lines first so they're below the bases */
		for (var i = 0; i < res.map.roads.length; i++) {
			var road = res.map.roads[i];
			var from = get_base(road[0]).loc;
			var to = get_base(road[1]).loc;

			new L.polyline(
				[get_base(road[0]).loc, get_base(road[1]).loc],
				{color: 'darkorange'}
			).addTo(map);
		}

		for (var i = 0; i < res.map.bases.length; i++) {
			var base = res.map.bases[i];
			var circle_colour;
			switch (base.base) {
			case 1:
				circle_colour = "maroon";
				break;
			case 2:
				circle_colour = "navy";
				break;
			case 0:
			default:
				circle_colour = "darkorange";
				break;
			}
			base.circle = L.circle(base.loc, {radius: 256, color: circle_colour}).addTo(map);
		}
	} catch (e) {
		alert("fatal error: " + e + "\nreload page now");
		window.location.reload();
	}
}

function setup_board()
{

}

function get_base(id)
{
	for (var i = 0; i < bases.length; i++) {
		if (bases[i].id == id) {
			return bases[i];
		}
	}
	return null;
}
