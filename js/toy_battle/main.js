window.onload = main;

function main()
{
	var resources_url = ""
	var server_addr = "";
	var user = 0;

	while (true) {
		resources_url = prompt("Enter resource pack URL...");
		if (confirm("Confirm resource pack:\n"+resources_url)) {
			break;
		}
	}

	while (true) {
		server_addr = prompt("Enter server address...");
		if (confirm("Confirm server address:\n"+server_addr)) {
			break;
		}
	}

	while (true) {
		while (true) {
			user = prompt("Select player (1 or 2)");
			user = Number(user);
			if (user == 1 || user == 2) {
				break;
			}
			alert("Player must be 1 or 2");
		}
		if (confirm("Confirm playing as Player " + user)) {
			break;
		}
	}

	board_init(user, resources_url);
	if (user == 1 && confirm("Do you want to re-initialise the game?")) {
		setup_board();
		update_server();
	}

	setInterval(function() {game_loop(server_addr, user)}, 5000);
}
