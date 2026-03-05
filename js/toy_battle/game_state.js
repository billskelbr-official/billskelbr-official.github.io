var game_state = {};
/* see js/toy_battle/game_state.txt for details on game state */

function game_loop(server_addr, user)
{
	/* check for updates */
}

function set_server_state(url)
{
	var dest = url + "/set_state.php?state=" + btoa(game_state);
	var resp = JSON.parse(http_get(dest));
	if (resp.status != 0) {
		alert(resp.body);
		return null;
	}
	return resp.body;
}

function get_server_state(url)
{
	var dest = url + "/get_state.php";
	var resp = JSON.parse(http_get(dest));
	if (resp.status != 0) {
		alert(resp.body);
		return 1;
	}
	game_state = atob(resp.body);
	return 0;
}
