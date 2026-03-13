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
	if (user == 1 && !confirm("Click cancel to start a new game\nClick OK to join the current game")) {
		initialise_gamestate();
		clear_server_state();
		set_server_state();
		show_current_gamestate();
	}
	setInterval(function() {game_loop()}, 7000);
}
