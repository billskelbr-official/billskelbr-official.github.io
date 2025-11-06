function generate_fail(msg)
{
	alert("failed to generate map: " + msg);
}

function find_place_with_id(id)
{
	for (var i = 0; i < places.length; i++) {
		if (places[i].id == id) {
			return places[i];
		}
	}
	return null;
}

function find_place_with_latlng(latlng)
{
	for (var i = 0; i < places.length; i++) {
		if (places[i].loc.lat == latlng.lat && places[i].loc.lng == latlng.lng) {
			return places[i];
		}
	}
	return null;
}

function find_road_with_ids(ends)
{
	for (var i = 0; i < roads.length; i++) {
		if (roads[i].points[0] == ends[0] && roads[i].points[1] == ends[1]) {
			return roads[i];
		}
	}
	return null;
}

function write2file(filename, fileContent)
{
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function abort()
{
	alert("aborted");
	throw new Error("oops something is broken :3")
	return;

}

function click_on(el)
{
	el.dispatchEvent(new Event("click", {bubbles: true}))
}

function rand_up_to(max)
{
	return Math.floor(Math.random() * (max + 1));
}

function debug_find_disconnected_nodes()
{
	for (var i = 0; i < places.length; i++) {
		var has_road = false;
			for (var j = 0; j < roads.length; j++) {
			if (roads[j].points[0] == places[i].id || roads[j].points[1] == places[i].id) {
			has_road = true;
					break;
			}
		}
		if (has_road == false) {
			console.log("id "+places[i].id+" (index "+i+") has no road!")
		}
	}
}
