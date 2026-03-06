var server_addr;
var map;
var cards;
var areas;
var bases;
var cur_num = 0;

/* see js/toy_battle/game_state.txt for details on game state */
var game_state = null;

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
		cards = res.cards;

		map = L.map('map').setView(res.map.center, 13);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		bases = res.map.bases;

		/* add the lines and areas first so they're below the bases */
		for (var i = 0; i < res.map.roads.length; i++) {
			var road = res.map.roads[i];
			new L.polyline(
				[get_base(road[0]).loc, get_base(road[1]).loc],
				{color: 'darkorange'}
			).addTo(map);
		}

		areas = res.map.areas;
		for (var i = 0; i < res.map.areas.length; i++) {
			var area = res.map.areas[i];
			var pts =[];
			for (var j = 0; j < area.border.length; j++) {
				pts.push(get_base(area.border[j]).loc);
			}
			area.polygon = new L.polygon(
				pts,
				{color: 'darkorange', stroke: false}
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

function initialise_gamestate()
{
	game_state = {
		turn_number: 0,
		turn: 1,
		money: [0, 0],
		board: {
			bases: [],
			areas: []
		},
		cards: {
			hands: [[], []],
			decks: [[], []],
			faceup: [[], []]
		}
	};

	for (var i = 0; i < bases.length; i++) {
		game_state.board.bases.push({id: bases[i].id, owner: 0, card: 0});
	}
	for (var i = 0; i < areas.length; i++) {
		game_state.board.areas.push({id: areas[i].id, cash: areas[0].cash});
	}

	for (var i = 0; i < cards.length; i++) {
		for (var j = 0; j < cards[i].count; j++) {
			game_state.cards.decks[0].push(cards[i].id);
			game_state.cards.decks[1].push(cards[i].id);
		}
	}
	for (var i = 0; i < 4; i++) {
		game_state.cards.decks[0].splice(randint(game_state.cards.decks[0].length), 1);
		game_state.cards.decks[1].splice(randint(game_state.cards.decks[1].length), 1);
	}
	for (var i = 0; i < 3; i++) {
		var ind = randint(game_state.cards.decks[0].length);
		game_state.cards.hands[0].push(game_state.cards.decks[0][ind]);
		game_state.cards.decks[0].splice(ind, 1);
	}
	for (var i = 0; i < 4; i++) {
		var ind = randint(game_state.cards.decks[1].length);
		game_state.cards.hands[1].push(game_state.cards.decks[1][ind]);
		game_state.cards.decks[1].splice(ind, 1);
	}
}

function show_current_gamestate()
{
	/* todo... */
}

function game_loop()
{
	get_server_state();
	show_current_gamestate();
}

function clear_server_state()
{
	internal_write_server_state("");
}

function set_server_state()
{
	internal_write_server_state(btoa(JSON.stringify(game_state)));
}

function internal_write_server_state(payload)
{
	try {
		var dest = server_addr + "/write_state.php?state=" + payload;
		var resp = http_get_json(dest);
		if (resp.status != 0) {
			alert(resp.body);
			return;
		}
	} catch (e) {
		alert("could not send game state to server\n" + e);
	}
}

/* returns -1 on error, 0 on no action needed, 1 if new info received */
function get_server_state()
{
	var server_num;
	try {
		var dest = server_addr + "/get_num.php";
		var resp = http_get_json(dest);
		if (resp.status != 0) {
			alert(resp.body);
			return -1;
		}
		server_num = resp.body;
	} catch (e) {
		alert("could not get game state from server\n" + e);
	}

	if (cur_num >= server_num) {
		return 0;
	}

	try {
		var dest = server_addr + "/get_state.php";
		var resp = http_get_json(dest);
		if (resp.status != 0) {
			alert(resp.body);
			return -1;
		}
		game_state = JSON.parse(atob(resp.body));
	} catch (e) {
		alert("could not get game state from server\n" + e);
	}
	cur_num = server_num;
	return 1;
}

function set_server_addr(addr)
{
	server_addr = addr;
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
