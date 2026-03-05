function http_get_json(url)
{
    var xhr = new XMLHttpRequest();
	var ret;
    xhr.open("GET", url, false);
    xhr.send(null);

	try {
		ret = JSON.parse(xhr.responseText);
	} catch {
		ret = null;
	}
	return ret;
}
