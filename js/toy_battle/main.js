window.onload = main;

function main()
{
	var settings;
	var resources_url;
	var server_addr;
	var user;

	if (document.referrer.search("setup.html") == -1) {
		window.location.href = "setup.html";
	}

	try {
		settings = JSON.parse(atob((new URL(window.location)).searchParams.get("settings")));
		resources_url = settings.resource;
		server_addr = settings.server;
		user = settings.player;
	} catch (e) {
		alert("fatal error: "+e+"\n");
		window.location.href = "setup.html";
	}

	set_server_addr(server_addr);
	set_player(user);

	board_init(user, resources_url);
	if (settings.startgame == 1) {
		initialise_gamestate();
		clear_server_state();
		set_server_state();
		/* rejoin in join current game mode to allow user to refresh game page without wiping current game */
		/* have to rejoin through setup.html because this page checks referrer */
		settings.startgame = 0;
		window.location.href = "setup.html?settings="+btoa(JSON.stringify(settings));
	}
	game_loop();
	gameupdate = setInterval(function() {game_loop()}, 5000);
}
