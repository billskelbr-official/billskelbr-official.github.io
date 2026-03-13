const DEFAULTGAMESTATE = {
	win: 0,
	turn_number: 0,
	turn: 0,
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
}

var server_addr;
var map;
var cards;
var areas;
var bases;
var cur_num = 0;
var user = 0;
var selected_card = null;
var links;
var winmoney;

/* see js/toy_battle/game_state.txt for details on game state */
var game_state = DEFAULTGAMESTATE;

function board_init(user, resources_url)
{
	var res;
	var team_banner = document.getElementById("yourteam");

	team_banner.innerHTML = "You are Player " + user;
	team_banner.classList.add("p"+user+"bg");

	res = http_get_json(resources_url);
	if (res == null) {
		alert("fatal error: could not initialise resources\nreload page now");
		window.location.reload();
	}

	try {
		cards = res.cards;

		map = L.map("map").setView(res.map.center, 13);
		map.setMaxBounds([
			[res.map.center[0]-0.2, res.map.center[1]-0.05],
			[res.map.center[0]+0.2, res.map.center[1]+0.05]
		]);
		map.setMinZoom(12);
		map.setMaxZoom(15);
/*
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
*/
		winmoney = res.rules.winmoney;
		document.getElementById("moneytitle").innerText = "Money ($" + winmoney + " to win)";

		bases = res.map.bases;
		for (var i = 0; i < bases.length; i++) {
			bases[i].neighbours = [];
		}

		/* add the lines and areas first so they're below the bases */
		for (var i = 0; i < res.map.roads.length; i++) {
			var road = res.map.roads[i];
			get_base(road[0]).neighbours.push(road[1]);
			get_base(road[1]).neighbours.push(road[0]);
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

		for (var i = 0; i < bases.length; i++) {
			var base = bases[i];
			var base_circle = L.circle(base.loc, {radius: 360, color: "darkorange"}).addTo(map);

			switch (base.base) {
			case 1: /* team 1 base */
				base.circle = L.rectangle(base_circle.getBounds(), {color: "maroon"}).addTo(map);
				base_circle.removeFrom(map);
				break;
			case 2:
				base.circle = L.rectangle(base_circle.getBounds(), {color: "navy"}).addTo(map);
				base_circle.removeFrom(map);
				break;
			case 0:
			default:
				base.circle = base_circle;
				break;
			}
			/* click to show list of cards played, rightclick to play card */
			/* i cant figure out how to implement this function thingy and so ain't much help either, so i came up with this. terry would NOT consider this Divine Intellect. */
			base.circle.on("click", Function("clickhandler_base(" + base.id + ")"));
			base.circle.on("contextmenu", Function("clickhandler_rightclick_base(" + base.id + ")"));
			base.circle.addTo(map);
		}

		links = res.redirects;
	} catch (e) {
		alert("fatal error: " + e + "\nreload page now");
		window.location.reload();
	}
}

function initialise_gamestate()
{
	game_state = DEFAULTGAMESTATE;
	game_state.turn = 1;

	for (var i = 0; i < bases.length; i++) {
		game_state.board.bases.push({id: bases[i].id, cards: []});
	}
	for (var i = 0; i < areas.length; i++) {
		game_state.board.areas.push({id: areas[i].id, cash: areas[i].cash});
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
	/* win? */
	if (game_state.win != 0) {
		var dest;
		if (game_state.win == user) {
			dest = links.win;
		} else {
			dest = links.lose;
		}
		if (!dest) {
			if (game_state.win == user) {
				alert("you win!");
			} else {
				alert("you lose!");
			}
			dest = "http://bilskelbr.atwebpages.com/toy_battle";
		}
		window.location.href = dest;
	}

	/* current game turn */
	document.getElementById("curturn").innerHTML = "Current turn: Player "+game_state.turn;

	document.getElementById("curturn").classList.remove("p"+((!(game_state.turn-1))+0)+"bg");
	document.getElementById("curturn").classList.add("p"+game_state.turn+"bg");

	document.getElementById("enemyhand").innerText = "Enemy has "+game_state.cards.hands[(!(user-1))+0].length+" cards";

	/* money */
	document.getElementById("p1_money").innerHTML = game_state.money[0];
	document.getElementById("p2_money").innerHTML = game_state.money[1];

	/* reset selected card because the buttons are deselected */
	selected_card = null;
	/* draw cards to hand */
	clear_cards_in_hand();
	show_cards_in_hand();

	/* players money */
	document.getElementById("p1_money").innerText = game_state.money[0];
	document.getElementById("p2_money").innerText = game_state.money[1];

	/* map stuff - cash in areas */
	for (var i = 0; i < game_state.board.areas.length; i++) {
		var areastate = game_state.board.areas[i];

		var area = get_area(areastate.id);
		if (areastate.cash == 0) {
			area.polygon.removeFrom(map);
		} else {
			area.polygon.bindTooltip("$"+areastate.cash, {permanent: true, direction:"center"});
		}
	}

	/* maps stuff - units on bases */
	update_map_colours();

}

function clear_cards_in_hand()
{
	for (var i = 0; i < 8; i++) {
		document.getElementById("c"+i+"n").innerText = "";
		document.getElementById("c"+i+"i").innerText = "";
		document.getElementById("c"+i+"p").innerText = "";
		document.getElementById("c"+i+"b").disabled = true;
	}
}

function update_map_colours()
{
	for (var i = 0; i < bases.length; i++) {
		var b = bases[i];
		var gsb = get_gs_base(b.id);

		if (b.base != 0) {
			continue;
		}
		if (gsb.cards.length == 0) {
			b.circle.setStyle({color: "darkorange"});
		} else if (gsb.cards[gsb.cards.length-1][0] == 1) {
			b.circle.setStyle({color: "maroon"});
		} else {
			b.circle.setStyle({color: "navy"});
		}
	}
}

function show_cards_in_hand()
{
	for (var i = 0; i < game_state.cards.hands[user-1].length; i++) {
		var card = get_card(game_state.cards.hands[user-1][i]);

		var strength_txt = card.strength;
		if (card.strength == 0) {
			strength_txt = "WILDCARD";
		}
		var imgnode = document.createElement("img");
		imgnode.src = card.img;
		imgnode.width = 200;
		imgnode.height = 150;
		document.getElementById("c"+i+"n").innerText = card.name + "("+strength_txt+")";
		document.getElementById("c"+i+"i").textContent = "";
		document.getElementById("c"+i+"i").appendChild(imgnode);
		document.getElementById("c"+i+"p").innerText = card.desc;
		document.getElementById("c"+i+"b").onclick = Function("cardselect(" + i + ");");
		document.getElementById("c"+i+"b").disabled = false;
	}
}

function game_loop()
{
	/* pause checking when it's our turn */
	if (game_state.turn != user && get_server_state() == 1) {
		show_current_gamestate();
	}
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
	return internal_id_search(bases, id);
}

function get_card(id)
{
	return internal_id_search(cards, id);
}

function get_area(id)
{
	return internal_id_search(areas, id);
}

function get_gs_base(id)
{
	return internal_id_search(game_state.board.bases, id);
}

function get_gs_area(id)
{
	return internal_id_search(game_state.board.areas, id);
}

function internal_id_search(arr, id)
{
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].id == id) {
			return arr[i];
		}
	}
	return null;
}

function set_player(u)
{
	user = u;
}

function clickhandler_base(id)
{
	var base = get_base(id);
	var gsbase = get_gs_base(id);
	var popupcontent;
	if (base.base == user) {
		popupcontent = "<p class=\"p1bg\">Player 1 discarded faceup:</p>";
		for (var i = 0; i < game_state.cards.faceup[0].length; i++) {
			var card = get_card(game_state.cards.faceup[0][i]);
			popupcontent += "<p class=\"p1bg\">";
			popupcontent += card.name;
			popupcontent += " (" + card.strength + ")";
			popupcontent += "</p>";
		}
		popupcontent += "<p class=\"p2bg\">Player 2 discarded faceup:</p>";
		for (var i = 0; i < game_state.cards.faceup[1].length; i++) {
			var card = get_card(game_state.cards.faceup[1][i]);
			popupcontent += "<p class=\"p2bg\">";
			popupcontent += card.name;
			popupcontent += " (" + card.strength + ")";
			popupcontent += "</p>";
		}
	} else {
		popupcontent = "<p>cards here (top to bottom):</p>";
		for (var i = gsbase.cards.length-1; i >= 0 ; i--) {
			var gscard = gsbase.cards[i];
			var card = get_card(gscard[1]);
			popupcontent += "<p class=\"p"+gscard[0]+"bg\">";
			popupcontent += "(Player " + gscard[0] + ") ";
			popupcontent += card.name + " ";
			popupcontent += "("+card.strength+")</p>";
		}
	}
	L.popup()
		.setLatLng(base.loc)
		.setContent(popupcontent)
		.addTo(map)
		.openOn(map);
}

function clickhandler_rightclick_base(id)
{
	if (game_state.turn != user) {
		alert("it is not yet your turn!");
		return;
	}

	var base = get_base(id);
	if (base.base == user) {
		selected_card = null;
		/* draw 2 cards */
		if (game_state.cards.hands[user-1].length <= 6) {
			var choice = randint(game_state.cards.decks[user-1].length);
			game_state.cards.hands[user-1].push(game_state.cards.decks[user-1][choice]);
			game_state.cards.decks[user-1].splice(choice, 1);
		}
		if (game_state.cards.hands[user-1].length <= 7) {
			var choice = randint(game_state.cards.decks[user-1].length);
			game_state.cards.hands[user-1].push(game_state.cards.decks[user-1][choice]);
			game_state.cards.decks[user-1].splice(choice, 1);
		}
		next_round();
		return;
	}

	if (selected_card == null) {
		alert("no card selected!");
		return;
	}
	map.closePopup();

	/* cannot place on own base */
	var base = get_base(id);
	if (base.base == user) {
		alert("You cannot place a unit on your own base!");
		return;
	}

	/* handle strength comparisons */
	var gsbase = get_gs_base(id);
	var played_card = get_card(game_state.cards.hands[user-1][selected_card]);
	var topcardstr;
	/* duck card handled below as well */
	if (played_card.strength == 0 || gsbase.cards.length == 0 || gsbase.cards[gsbase.cards.length-1][0] == user) {
		topcardstr = -1;
	} else {
		topcardstr = get_card(gsbase.cards[gsbase.cards.length-1][1]).strength;
	}
	if (played_card.strength <= topcardstr) {
		alert(
			"your card is too weak!\n" +
			"\tYour card's strength: "+played_card.strength + "\n" +
			"\tEnemy's strength: "+topcardstr
		);
		return;
	}

	/* handle connection to base requirements */
	var base = get_base(id);

	var connected2base = 0;
	if (played_card.ability != 4 || base.base != 0) { /* ability 4 can airdrop anywhere except if placing on enemy base*/
		var connected = [id];
		var todo = JSON.parse(JSON.stringify(base.neighbours));

		while (todo.length > 0) {
			/* discard top item if it is in connected */
			var skip = 0;
			for (var i = 0; i < connected.length; i++) {
				if (connected[i] == todo[0]) {
					skip = 1;
					break;
				}
			}
			if (skip) {
				todo.splice(0, 1);
				continue;
			}

			/* succeed if base found */
			if (get_base(todo[0]).base == user) {
				connected2base = 1;
				break;
			}

			/* skip if top item not owned by you */
			var td0gsbase = get_gs_base(todo[0]);
			if (td0gsbase.cards.length == 0 || td0gsbase.cards[td0gsbase.cards.length-1][0] != user) {
				todo.splice(0, 1);
				continue;
			}

			/* otherwise this is connected. push to connected and add children */
			connected.push(todo[0]);
			var nb = get_base(todo[0]).neighbours;
			for (var i = 0; i < nb.length; i++) {
				if (nb[i] != todo[0]) {
					todo.push(nb[i]);
				}
			}
			todo.splice(0, 1);
		}
		if (!connected2base) {
			alert("You can only play this card to connected bases!");
			return;
		}
	}

	game_state.cards.hands[user-1].splice(selected_card, 1);
	gsbase.cards.push([user, played_card.id]);
	selected_card = null;

	/* clear and rewrite the cards in hand */
	clear_cards_in_hand();
	show_cards_in_hand();
	update_map_colours();

	switch (played_card.ability) {
	case 1: /* draw 2 */
		if (game_state.cards.hands[user-1].length <= 6) {
			var choice = randint(game_state.cards.decks[user-1].length);
			game_state.cards.hands[user-1].push(game_state.cards.decks[user-1][choice]);
			game_state.cards.decks[user-1].splice(choice, 1);
		}
		/* fallthrough :3 */
	case 6: /* draw 1 */
		if (game_state.cards.hands[user-1].length <= 7) {
			var choice = randint(game_state.cards.decks[user-1].length);
			game_state.cards.hands[user-1].push(game_state.cards.decks[user-1][choice]);
			game_state.cards.decks[user-1].splice(choice, 1);
		};
	case 4: /* can be placed anywhere (ability handled already above) */
	case 0: /* no ability (incl duck) */
		next_round();
		return;

	case 2: /* play another turn */
		return;

	case 3: /* discard surrounding */
		alert("ability id "+played_card.ability+" not implemented");
		next_round();
		return;
	case 5: /* discard from opponent hand */
		var enemy = 1+!(user-1);
		if (game_state.cards.hands[enemy-1].length == 0) {
			alert("Enemy has no cards to discard!");
		} else {
			var discard_ind = randint(game_state.cards.hands[enemy-1].length);
			game_state.cards.faceup[enemy-1].push(game_state.cards.hands[enemy-1][discard_ind]);
			game_state.cards.hands[enemy-1].splice(discard_ind, 1);
		}
		next_round();
		return;
	}
}

function cardselect(ind)
{
	for (var i = 0; i < game_state.cards.hands[user-1].length; i++) {
		document.getElementById("c"+i+"b").disabled = false;
	}
	document.getElementById("c"+ind+"b").disabled = true;
	selected_card = ind;
}

function next_round()
{
	/* check for capture of areas */
	var captured = [];
	for (var i = 0; i < game_state.areas.length; i++) {
		var a = get_area(game_state.areas[i]);
		var bord = a.border;
		var gsbase = get_gs_base(bord[0]);
		var base = get_base(bord[0]);
		if (gsbase.cards.length == 0 && base.base == 0) {
			continue;
		}

		if (game_state.areas[i].cash == 0) {
			continue;
		}

		var owner = base.base;
		if (owner == 0) {
			owner = gsbase.cards[gsbase.cards.length-1][0];
		}
		var owned = 1;
		for (var j = 1; j < bord.length; j++) {
			var bs = get_gs_base(bord[j]);
			if ((bs.cards.length == 0 || bs.cards[bs.cards.length-1][0] != owner) && get_base(bord[j]).base != owner) {
				owned = 0;
				break;
			}
		}
		if (owned) {
			captured.push([owner, a.id]);
		}
	}
	for (var i = captured.length-1; i >= 0; i--) {
		var area = areas[captured[i][1]];
		var owner = captured[i][0];
		game_state.money[owner-1] += area.cash;
		get_gs_area(captured[i][1]).cash = 0;
		area.polygon.removeFrom(map);
	}

	/* check for win */
	var p1b, p2b;
	for (var i = 0; i < bases.length; i++) {
		if (bases[i].base == 1) {
			p1b = bases[i];
		}
		if (bases[i].base == 2) {
			p2b = bases[i];
		}
	}
	p1b = get_gs_base(p1b.id);
	p2b = get_gs_base(p2b.id);
	if (p1b.cards.length != 0) {
		game_state.win = 2;
	}
	if (p2b.cards.length != 0) {
		game_state.win = 1;
	}
	if (game_state.money[0] >= winmoney) {
		game_state.win = 1;
	}
	if (game_state.money[1] >= winmoney) {
		game_state.win = 2;
	}

	/* change turns */
	if (game_state.turn == 1) {
		game_state.turn = 2;
	} else {
		game_state.turn = 1;
	}

	game_state.turn_number++;

	/* update current gamestate first before we update the server */
	show_current_gamestate();

	/* update the server */
	set_server_state();
}
