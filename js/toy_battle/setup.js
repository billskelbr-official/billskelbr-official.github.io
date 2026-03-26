function startgame()
{
	var resource = document.querySelector("input[name=\"resource\"]:checked").value;
	if (resource == "custom") {
		resource = document.getElementById("customresource").value;
	}
	var server = document.getElementById("serverinput").value;
	var player = document.querySelector("input[name=\"player\"]:checked").value;
	var startgame = document.querySelector("input[name=\"startgame\"]:checked").value;

	if (!confirm(
		"confirm settings: \n" +
		"\tResource file:\n" +
		"\t\t" + resource + "\n" +
		"\tServer address:\n" +
		"\t\t" + server + "\n" +
		"\tPlaying as:\n" +
		"\t\tPlayer " + player + "\n" +
		"\tJoin game:\n" +
		"\t\t" + (startgame == 0 ? "Current game" : "New game")
	)) {
		return;
	}

	var gamesettings = {
		resource: resource,
		server: server,
		player: player,
		startgame: startgame
	};

	window.location.href = "/toy_battle?settings="+btoa(JSON.stringify(gamesettings));
}
