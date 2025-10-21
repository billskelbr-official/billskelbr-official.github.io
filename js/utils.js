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

